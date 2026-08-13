import Link from "next/link";

export function OAuthLoginHint() {
  return (
    <div className="mt-8 border border-border bg-neutral-50 p-4 text-xs leading-relaxed text-muted">
      <p className="font-medium text-foreground">Google / Kakao로 가입하셨나요?</p>
      <p className="mt-2">
        소셜 로그인으로 가입한 계정은 비밀번호가 없습니다.{" "}
        <Link href="/login" className="text-foreground underline">
          로그인
        </Link>
        화면에서 Google 또는 Kakao 버튼을 이용해 주세요.
      </p>
    </div>
  );
}
