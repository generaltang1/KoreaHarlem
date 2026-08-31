import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThinkBoard } from "@/components/think/ThinkBoard";

export default function ThinkPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-12 pb-28 md:px-6">
        <Suspense fallback={<p className="text-center text-sm text-muted">불러오는 중…</p>}>
          <ThinkBoard />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
