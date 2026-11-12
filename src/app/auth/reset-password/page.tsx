"use client";

import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { AuthCard, AuthDarkShell } from "@/components/auth/AuthDarkShell";

function ResetPasswordFallback() {
  return (
    <AuthDarkShell>
      <AuthCard>
        <p className="text-center text-sm text-[#6e6b65]">확인 중...</p>
      </AuthCard>
    </AuthDarkShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
