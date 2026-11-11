"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentUser } from "@/lib/auth/session";
import { getMemberNickname } from "@/lib/think";

export type AdminAuditInput = {
  module: string;
  action: string;
  targetType?: string;
  targetId?: string | null;
  summary: string;
  meta?: Record<string, unknown>;
};

/** Admin 행위 감사 로그. 실패해도 본 작업은 막지 않음. */
export async function writeAdminAudit(input: AdminAuditInput): Promise<void> {
  try {
    const admin = createServiceClient();
    if (!admin) return;
    const user = await getCurrentUser();
    const nickname = user ? getMemberNickname(user) : "system";
    await admin.from("admin_audit_logs").insert({
      actor_user_id: user?.id ?? null,
      actor_email: user?.email ?? "",
      actor_nickname: nickname,
      module: input.module,
      action: input.action,
      target_type: input.targetType ?? "",
      target_id: input.targetId ?? null,
      summary: input.summary,
      meta: input.meta ?? {},
    });
  } catch (err) {
    console.error("[admin_audit]", err);
  }
}
