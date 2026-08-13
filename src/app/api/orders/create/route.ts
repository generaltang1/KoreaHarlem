import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { hashGuestPassword, validateGuestPassword } from "@/lib/guestPassword";
import { allocateOrderNumber } from "@/lib/orders";
import { fetchSizeStockMaps } from "@/lib/productSizeStock";
import type { ShippingAddress } from "@/lib/shippingAddress";
import { stockErrorMessage, validateLinesAgainstStock } from "@/lib/stock";

interface OrderItemInput {
  productId: string;
  title: string;
  size?: string | null;
  quantity: number;
  unitPrice: number;
  currency: string;
  imageUrl?: string | null;
  priceKrw: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      name,
      phone,
      shippingMessage,
      shipping,
      currency,
      exchangeRate,
      paymentMethod,
      items,
      total,
      shippingFee,
      guestPassword,
    } = body as {
      email: string;
      name: string;
      phone?: string;
      shippingMessage?: string;
      shipping?: ShippingAddress;
      currency: string;
      exchangeRate: number;
      paymentMethod?: string;
      items: OrderItemInput[];
      total: number;
      shippingFee?: number;
      guestPassword?: string;
    };

    if (!email || !name || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: "필수 값이 없습니다." }, { status: 400 });
    }

    if (!shipping?.postcode?.trim() || !shipping?.address?.trim()) {
      return NextResponse.json({ message: "배송지(우편번호·주소)를 입력해주세요." }, { status: 400 });
    }

    if (!phone?.trim()) {
      return NextResponse.json({ message: "휴대전화 번호를 입력해주세요." }, { status: 400 });
    }

    const stockLines = items
      .filter((item) => item.productId)
      .map((item) => ({
        productId: item.productId,
        size: item.size,
        quantity: item.quantity,
      }));

    const supabase = await createClient();
    const productIds = [...new Set(stockLines.map((l) => l.productId))];

    const adminForSale = createServiceClient() ?? supabase;
    if (productIds.length > 0) {
      const { data: productsForSale } = await adminForSale
        .from("products")
        .select("id, title, is_published, is_sale")
        .in("id", productIds);

      for (const productId of productIds) {
        const product = productsForSale?.find((p) => p.id === productId);
        if (!product?.is_published || !product.is_sale) {
          return NextResponse.json(
            {
              message: product
                ? `"${product.title}"은(는) 현재 구매할 수 없는 상품입니다.`
                : "구매할 수 없는 상품이 포함되어 있습니다.",
            },
            { status: 409 },
          );
        }
      }
    }

    const stockByProduct = await fetchSizeStockMaps(supabase, productIds);
    const stockErr = validateLinesAgainstStock(stockLines, stockByProduct);
    if (stockErr) {
      return NextResponse.json({ message: stockErr }, { status: 409 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isGuest = !user;
    let guestPasswordHash: string | null = null;
    if (isGuest) {
      if (!guestPassword) {
        return NextResponse.json({ message: "비회원 주문조회 비밀번호를 입력해주세요." }, { status: 400 });
      }
      const pwErr = validateGuestPassword(guestPassword);
      if (pwErr) return NextResponse.json({ message: pwErr }, { status: 400 });
      guestPasswordHash = await hashGuestPassword(guestPassword);
    }

    const orderNumber = await allocateOrderNumber(supabase);
    if (!orderNumber) {
      return NextResponse.json(
        { message: "주문번호 생성 실패. supabase/add_guest_orders.sql 실행 여부를 확인하세요." },
        { status: 500 },
      );
    }

    const tossOrderId = `kh_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const customerKey = user?.id ?? `guest_${Buffer.from(email).toString("base64url").slice(0, 40)}`;

    const shippingAddress = {
      postcode: shipping.postcode.trim(),
      address: shipping.address.trim(),
      addressDetail: shipping.addressDetail?.trim() ?? "",
      phone: phone.trim(),
      message: shippingMessage?.trim() || shipping.message?.trim() || "",
    };

    const orderPayload: Record<string, unknown> = {
      user_id: user?.id ?? null,
      status: "pending",
      currency,
      exchange_rate: exchangeRate,
      subtotal: total,
      total,
      shipping_fee: shippingFee ?? 0,
      customer_email: email.trim(),
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      shipping_message: shippingMessage?.trim() || null,
      shipping_address: shippingAddress,
      toss_order_id: tossOrderId,
      order_number: orderNumber,
      guest_password_hash: guestPasswordHash,
    };
    if (paymentMethod) orderPayload.payment_method = paymentMethod;

    let { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select("id")
      .single();

    if (orderError?.message?.includes("payment_method")) {
      delete orderPayload.payment_method;
      const retry = await supabase.from("orders").insert(orderPayload).select("id").single();
      order = retry.data;
      orderError = retry.error;
    }

    if (orderError?.message?.includes("order_number") || orderError?.message?.includes("guest_password")) {
      return NextResponse.json(
        { message: "주문 생성 실패. supabase/add_guest_orders.sql을 실행해주세요." },
        { status: 500 },
      );
    }

    if (orderError || !order) {
      return NextResponse.json(
        { message: orderError?.message || "주문 생성 실패. add_products.sql 실행 여부를 확인하세요." },
        { status: 500 },
      );
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        title: item.title,
        size: item.size ?? null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        currency: item.currency,
        image_url: item.imageUrl ?? null,
      })),
    );

    if (itemsError) {
      await createServiceClient()?.from("orders").delete().eq("id", order.id);
      return NextResponse.json({ message: itemsError.message }, { status: 500 });
    }

    const admin = createServiceClient() ?? supabase;
    const { error: reserveError } = await admin.rpc("reserve_stock_for_order", {
      p_order_id: order.id,
    });

    if (reserveError) {
      await admin.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { message: stockErrorMessage(reserveError) },
        { status: 409 },
      );
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber,
      tossOrderId,
      customerKey,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "서버 오류" },
      { status: 500 },
    );
  }
}
