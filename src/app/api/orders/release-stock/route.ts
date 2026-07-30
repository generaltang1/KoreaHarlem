import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { stockErrorMessage } from "@/lib/stock";

export async function POST(request: Request) {
  try {
    const { orderId, tossOrderId } = (await request.json()) as {
      orderId?: string;
      tossOrderId?: string;
    };

    if (!orderId && !tossOrderId) {
      return NextResponse.json({ message: "orderId 또는 tossOrderId가 필요합니다." }, { status: 400 });
    }

    const supabase = createServiceClient() ?? (await createClient());

    let resolvedOrderId = orderId;
    if (!resolvedOrderId && tossOrderId) {
      const { data: order } = await supabase
        .from("orders")
        .select("id, status")
        .eq("toss_order_id", tossOrderId)
        .maybeSingle();
      if (!order) {
        return NextResponse.json({ ok: true, skipped: true });
      }
      if (order.status === "paid") {
        return NextResponse.json({ ok: true, skipped: true });
      }
      resolvedOrderId = order.id;
    }

    const { error } = await supabase.rpc("release_stock_for_order", {
      p_order_id: resolvedOrderId,
    });

    if (error) {
      return NextResponse.json({ message: stockErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "서버 오류" },
      { status: 500 },
    );
  }
}
