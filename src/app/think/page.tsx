import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";

export default function ThinkPage() {
  return (
    <>
      <Header />
      <main className="mx-auto flex min-h-[50vh] max-w-7xl flex-col items-center justify-center px-4 py-24 text-center md:px-6">
        <p className="text-[10px] uppercase tracking-widest text-muted">Think</p>
        <h1 className="mt-2 text-2xl font-medium uppercase tracking-wider">Coming Soon</h1>
        <p className="mt-4 max-w-md text-sm text-muted">아직 준비 중인 콘텐츠입니다.</p>
        <Link href="/" className="mt-8 text-xs uppercase tracking-widest underline">
          홈으로
        </Link>
      </main>
      <Footer />
    </>
  );
}
