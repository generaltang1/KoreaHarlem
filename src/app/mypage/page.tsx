import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-16 pb-24 md:px-6">
        <p className="text-[10px] uppercase tracking-widest text-muted">Account</p>
        <h1 className="mt-1 text-2xl font-medium uppercase tracking-wider">My Page</h1>

        {!user ? (
          <div className="mt-10 border border-border p-8 text-center">
            <p className="text-sm text-muted">로그인이 필요합니다.</p>
            <Link href="/login?next=/mypage" className="mt-4 inline-block text-xs uppercase tracking-widest underline">
              Sign In
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-4">
            <div className="border border-border p-6">
              <p className="text-[10px] uppercase tracking-widest text-muted">계정</p>
              <p className="mt-2 text-sm">{user.email}</p>
            </div>

            <nav className="divide-y divide-border border border-border">
              <Link
                href="/mypage/orders"
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-neutral-50"
              >
                <div>
                  <p className="text-sm font-medium">주문내역</p>
                  <p className="mt-0.5 text-xs text-muted">주문 현황 · 상세 조회</p>
                </div>
                <span className="text-xs text-muted">→</span>
              </Link>
              <Link
                href="/order-inquiry"
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-neutral-50"
              >
                <div>
                  <p className="text-sm font-medium">비회원 주문조회</p>
                  <p className="mt-0.5 text-xs text-muted">주문번호 · 비밀번호로 조회</p>
                </div>
                <span className="text-xs text-muted">→</span>
              </Link>
              <Link
                href="/sale"
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-neutral-50"
              >
                <div>
                  <p className="text-sm font-medium">쇼핑 계속하기</p>
                  <p className="mt-0.5 text-xs text-muted">Sale</p>
                </div>
                <span className="text-xs text-muted">→</span>
              </Link>
            </nav>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
