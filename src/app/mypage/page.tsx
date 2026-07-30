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
            <Link href="/login" className="mt-4 inline-block text-xs uppercase tracking-widest underline">
              Sign In
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-4 border border-border p-6">
            <p className="text-sm">이메일: {user.email}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/sale" className="border border-border px-4 py-2 text-[10px] uppercase tracking-widest">
                Sale
              </Link>
              <Link href="/checkout" className="border border-border px-4 py-2 text-[10px] uppercase tracking-widest">
                Checkout
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
