import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { UsageGuideContent } from "@/components/guide/UsageGuideContent";

export default function GuidePage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-16 pb-24 md:px-6">
        <p className="text-[10px] uppercase tracking-widest text-muted">Guide</p>
        <h1 className="mt-1 text-2xl font-medium uppercase tracking-wider">이용안내</h1>
        <p className="mt-3 text-sm text-muted">
          결제, 배송, 교환·반품, 환불에 관한 안내입니다.
        </p>
        <div className="mt-10 border-t border-border pt-10">
          <UsageGuideContent />
        </div>
        <Link href="/" className="mt-12 inline-block text-xs uppercase tracking-widest underline">
          홈으로
        </Link>
      </main>
      <Footer />
    </>
  );
}
