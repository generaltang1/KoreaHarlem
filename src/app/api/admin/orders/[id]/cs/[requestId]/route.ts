import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/adminApi";
import { csRequestTypeLabel } from "@/lib/csRequests";
import { createServiceClient } from "@/lib/supabase/admin";
import { stockErrorMessage } from "@/lib/stock";
import { cancelTossPayment, orderTotalToTossCancelAmount } from "@/lib/toss";

type RouteContext = { params: Promise<{ id: string; requestId: string }> };

type CsAdminAction = "approve" | "reject" | "received" | "complete";

/** 관리자: CS 요청 처리 */
export async function POST(request: Request, context: RouteContext) {
  const auth = await assertAdminApi();
  if (auth.error) return auth.error;

  const { id, requestId } = await context.params;
  const body = (await request.json()) as {
    action?: CsAdminAction;
    adminNote?: string;
    restoreStock?: boolean;
    runTossRefund?: boolean;
  };

  const action = body.action;
  if (!action || !["approve", "reject", "received", "complete"].includes(action)) {
    return NextResponse.json({ message: "action이 필요합니다." }, { status: 400 });
  }

  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }, { status: 503 });
  }

  const { data: csReq } = await admin
    .from("order_cs_requests")
    .select("*")
    .eq("id", requestId)
    .eq("order_id", id)
    .maybeSingle();

  if (!csReq) {
    return NextResponse.json({ message: "CS 요청을 찾을 수 없습니다." }, { status: 404 });
  }

  const { data: order } = await admin
    .from("orders")
    .select(
      "id, status, order_number, total, currency, toss_payment_key, refunded_amount, user_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ message: "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  const now = new Date().toISOString();
  const adminNote = body.adminNote?.trim() || null;
  const actorId = auth.user.id;

  if (action === "approve") {
    if (csReq.status !== "requested") {
      return NextResponse.json({ message: "요청접수 상태만 승인할 수 있습니다." }, { status: 400 });
    }
    await admin
      .from("order_cs_requests")
      .update({ status: "approved", admin_note: adminNote, updated_at: now })
      .eq("id", requestId);
    return NextResponse.json({ ok: true, status: "approved" });
  }

  if (action === "reject") {
    if (!["requested", "approved"].includes(csReq.status)) {
      return NextResponse.json({ message: "현재 상태에서는 반려할 수 없습니다." }, { status: 400 });
    }
    const restoreTo = csReq.previous_status || "delivered";
    await admin
      .from("order_cs_requests")
      .update({
        status: "rejected",
        admin_note: adminNote,
        updated_at: now,
        resolved_at: now,
      })
      .eq("id", requestId);
    await admin.from("orders").update({ status: restoreTo }).eq("id", id);
    await admin.from("order_status_histories").insert({
      order_id: id,
      from_status: order.status,
      to_status: restoreTo,
      changed_by: actorId,
      reason: adminNote || `${csRequestTypeLabel(csReq.request_type)} 요청 반려`,
    });
    return NextResponse.json({ ok: true, status: "rejected", orderStatus: restoreTo });
  }

  if (action === "received") {
    if (!["requested", "approved"].includes(csReq.status)) {
      return NextResponse.json({ message: "승인(또는 요청) 상태에서만 검수완료 처리할 수 있습니다." }, { status: 400 });
    }
    if (csReq.request_type !== "return" && csReq.request_type !== "exchange") {
      return NextResponse.json({ message: "반품/교환만 회수·검수 단계가 있습니다." }, { status: 400 });
    }
    await admin
      .from("order_cs_requests")
      .update({ status: "received", admin_note: adminNote, updated_at: now })
      .eq("id", requestId);

    if (csReq.request_type === "return") {
      await admin.from("orders").update({ status: "return_received" }).eq("id", id);
      await admin.from("order_status_histories").insert({
        order_id: id,
        from_status: order.status,
        to_status: "return_received",
        changed_by: actorId,
        reason: adminNote || "반품 회수·검수 완료",
      });
    }
    return NextResponse.json({ ok: true, status: "received" });
  }

  if (action === "complete") {
    if (!["requested", "approved", "received"].includes(csReq.status)) {
      return NextResponse.json({ message: "완료 처리할 수 없는 상태입니다." }, { status: 400 });
    }

    const runTossRefund = body.runTossRefund !== false;
    const restoreStock = body.restoreStock !== false;
    let refunded = false;

    // 반품·환불 요청: 토스 전액 환불
    if (
      (csReq.request_type === "return" || csReq.request_type === "refund") &&
      runTossRefund
    ) {
      if (!order.toss_payment_key) {
        return NextResponse.json(
          { message: "결제 키가 없어 토스 환불을 할 수 없습니다. 수동 환불 후 재고만 복구하세요." },
          { status: 400 },
        );
      }
      const cancelAmount = orderTotalToTossCancelAmount(order.total, order.currency);
      const tossResult = await cancelTossPayment({
        paymentKey: order.toss_payment_key,
        settlementCurrency: order.currency,
        cancelReason: adminNote || csReq.reason || "반품/환불 완료",
        cancelAmount,
        idempotencyKey: `cs-complete-${csReq.id}`,
      });
      if (!tossResult.ok) {
        return NextResponse.json(
          { message: tossResult.message, code: tossResult.code },
          { status: 400 },
        );
      }
      refunded = true;

      if (restoreStock) {
        // 재고 복구를 위해 일시적으로 return_received 등으로 맞춤
        if (!["return_received", "return_requested", "shipped", "delivered"].includes(order.status)) {
          await admin.from("orders").update({ status: "return_received" }).eq("id", id);
        }
        const { error: stockError } = await admin.rpc("restore_stock_for_paid_order", {
          p_order_id: id,
        });
        if (stockError) {
          return NextResponse.json(
            {
              message: `토스 환불은 완료되었으나 재고 복구 실패: ${stockErrorMessage(stockError)}`,
              refunded: true,
            },
            { status: 500 },
          );
        }
      }

      const newRefundedAmount = (order.refunded_amount ?? 0) + cancelAmount;
      const finalStatus = csReq.request_type === "return" ? "returned" : "refunded";
      await admin
        .from("orders")
        .update({
          status: finalStatus,
          cancel_reason: csReq.reason,
          refunded_at: now,
          refunded_amount: newRefundedAmount,
          cancelled_at: now,
        })
        .eq("id", id);
      await admin.from("order_status_histories").insert({
        order_id: id,
        from_status: order.status,
        to_status: finalStatus,
        changed_by: actorId,
        reason: adminNote || `${csRequestTypeLabel(csReq.request_type)} 완료(환불)`,
      });
    } else if (csReq.request_type === "exchange") {
      await admin.from("orders").update({ status: "exchange_completed" }).eq("id", id);
      await admin.from("order_status_histories").insert({
        order_id: id,
        from_status: order.status,
        to_status: "exchange_completed",
        changed_by: actorId,
        reason: adminNote || `교환 완료${csReq.exchange_size ? ` → ${csReq.exchange_size}` : ""}`,
      });
    } else {
      // 토스 없이 완료 (수동 환불 가정)
      const finalStatus = csReq.request_type === "return" ? "returned" : "refunded";
      if (restoreStock && (csReq.request_type === "return" || csReq.request_type === "refund")) {
        if (!["return_received", "return_requested", "shipped", "delivered"].includes(order.status)) {
          await admin.from("orders").update({ status: "return_received" }).eq("id", id);
        }
        await admin.rpc("restore_stock_for_paid_order", { p_order_id: id });
      }
      await admin
        .from("orders")
        .update({
          status: finalStatus,
          cancel_reason: csReq.reason,
          cancelled_at: now,
        })
        .eq("id", id);
    }

    await admin
      .from("order_cs_requests")
      .update({
        status: "completed",
        admin_note: adminNote,
        updated_at: now,
        resolved_at: now,
      })
      .eq("id", requestId);

    return NextResponse.json({ ok: true, status: "completed", refunded });
  }

  return NextResponse.json({ message: "알 수 없는 action" }, { status: 400 });
}
