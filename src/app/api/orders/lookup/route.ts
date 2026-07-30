import { NextResponse } from "next/server";
import { verifyGuestPassword } from "@/lib/guestPassword";
import { paymentMethodLabel, orderStatusLabel } from "@/lib/orders";
import { parseShippingAddress } from "@/lib/shippingAddress";
import { createServiceClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { name, orderNumber, password } = (await request.json()) as {
      name?: string;
      orderNumber?: string;
      password?: string;
    };

    if (!name?.trim() || !orderNumber?.trim() || !password) {
      return NextResponse.json({ message: "주문자명, 주문번호, 비밀번호를 입력해주세요." }, { status: 400 });
    }

    const admin = createServiceClient();
    if (!admin) {
      return NextResponse.json(
        { message: "주문조회 서비스가 설정되지 않았습니다. SUPABASE_SERVICE_ROLE_KEY를 설정해주세요." },
        { status: 503 },
      );
    }

    const normalizedNumber = orderNumber.trim();
    const { data: order, error } = await admin
      .from("orders")
      .select(
        "id, order_number, status, currency, total, shipping_fee, subtotal, customer_name, customer_email, customer_phone, shipping_message, shipping_address, payment_method, created_at, guest_password_hash",
      )
      .eq("order_number", normalizedNumber)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ message: "주문 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    if (order.customer_name?.trim() !== name.trim()) {
      return NextResponse.json({ message: "주문 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    if (!order.guest_password_hash) {
      return NextResponse.json(
        { message: "회원 주문은 마이페이지에서 조회해주세요." },
        { status: 403 },
      );
    }

    const valid = await verifyGuestPassword(password, order.guest_password_hash);
    if (!valid) {
      return NextResponse.json({ message: "비밀번호가 일치하지 않습니다." }, { status: 401 });
    }

    const { data: items } = await admin
      .from("order_items")
      .select("title, size, quantity, unit_price, currency, image_url")
      .eq("order_id", order.id);

    const shipping = parseShippingAddress(order.shipping_address);

    return NextResponse.json({
      order: {
        orderNumber: order.order_number,
        status: order.status,
        statusLabel: orderStatusLabel(order.status),
        paymentMethod: paymentMethodLabel(order.payment_method),
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        shippingMessage: order.shipping_message,
        shipping,
        currency: order.currency,
        subtotal: order.subtotal,
        shippingFee: order.shipping_fee,
        total: order.total,
        createdAt: order.created_at,
        items: items ?? [],
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "서버 오류" },
      { status: 500 },
    );
  }
}
