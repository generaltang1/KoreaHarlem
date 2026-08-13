"use client";

import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

function ResetPasswordFallback() {
  return (
    <AuthPageShell
      eyebrow="Account"
      title="새 비밀번호"
      description="새로 사용할 비밀번호를 입력해 주세요."
    >
      <p className="text-center text-sm text-muted">확인 중...</p>
    </AuthPageShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
