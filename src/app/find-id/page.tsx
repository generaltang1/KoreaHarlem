import Link from "next/link";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { OAuthLoginHint } from "@/components/auth/OAuthLoginHint";

export default function FindIdPage() {
  return (
    <AuthPageShell
      eyebrow="Account"
      title="아이디 찾기"
      description="KoreaHarlem은 이메일을 로그인 아이디로 사용합니다."
    >
      <div className="space-y-4 text-sm leading-relaxed text-muted">
        <div className="border border-border p-5">
          <p className="font-medium text-foreground">이메일로 가입한 경우</p>
          <p className="mt-2">
            로그인 아이디는 <strong className="text-foreground">회원가입 시 입력한 이메일</strong>
            입니다. 비밀번호를 잊으셨다면 비밀번호 찾기를 이용해 주세요.
          </p>
          <Link
            href="/forgot-password"
            className="mt-4 inline-block text-xs uppercase tracking-widest underline"
          >
            비밀번호 찾기
          </Link>
        </div>
        <OAuthLoginHint />
      </div>
      <p className="mt-6 text-center text-xs text-muted">
        <Link href="/login" className="text-foreground underline">
          로그인
        </Link>
        {" · "}
        <Link href="/signup" className="text-foreground underline">
          회원가입
        </Link>
      </p>
    </AuthPageShell>
  );
}
