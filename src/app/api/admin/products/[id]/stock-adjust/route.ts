import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/adminApi";
import { normalizeSize } from "@/lib/stock";
import { createServiceClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

/** 재고 조정 이력 조회 */
export async function GET(_request: Request, context: RouteContext) {
  const auth = await assertAdminApi();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { data: stocks } = await admin
    .from("product_size_stock")
    .select("size, stock")
    .eq("product_id", id)
    .order("size");

  const { data: logs, error } = await admin
    .from("stock_adjustment_logs")
    .select("id, product_id, size, delta, stock_before, stock_after, reason, adjusted_by, created_at")
    .eq("product_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      {
        message: error.message.includes("stock_adjustment_logs")
          ? "add_stock_adjustment_logs.sql을 실행해주세요."
          : error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ stocks: stocks ?? [], logs: logs ?? [] });
}

/** 재고 ±수량 수기 조정 */
export async function POST(request: Request, context: RouteContext) {
  const auth = await assertAdminApi();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body = (await request.json()) as {
    size?: string;
    delta?: number;
    reason?: string;
  };

  const delta = Number(body.delta);
  const reason = body.reason?.trim() ?? "";
  const size = normalizeSize(body.size);

  if (!Number.isInteger(delta) || delta === 0) {
    return NextResponse.json({ message: "delta는 0이 아닌 정수여야 합니다." }, { status: 400 });
  }
  if (!reason) {
    return NextResponse.json({ message: "조정 사유를 입력해주세요." }, { status: 400 });
  }

  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { data: product } = await admin.from("products").select("id, sizes").eq("id", id).maybeSingle();
  if (!product) {
    return NextResponse.json({ message: "상품을 찾을 수 없습니다." }, { status: 404 });
  }

  const { data, error } = await admin.rpc("adjust_product_size_stock", {
    p_product_id: id,
    p_size: size,
    p_delta: delta,
    p_reason: reason,
    p_adjusted_by: auth.user.id,
  });

  if (error) {
    const msg = error.message || "";
    if (msg.includes("INSUFFICIENT_STOCK")) {
      return NextResponse.json({ message: "재고가 부족하여 차감할 수 없습니다." }, { status: 400 });
    }
    if (msg.includes("adjust_product_size_stock") || msg.includes("function") || msg.includes("stock_adjustment")) {
      return NextResponse.json(
        { message: "add_stock_adjustment_logs.sql을 실행해주세요." },
        { status: 500 },
      );
    }
    return NextResponse.json({ message: msg || "재고 조정에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, adjustment: data });
}
