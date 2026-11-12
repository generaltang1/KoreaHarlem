import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CheckoutClient } from "@/components/commerce/CheckoutClient";

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-[#0a0a0a] px-4 py-10 pb-24 text-neutral-100 sm:px-8">
        <Suspense fallback={<p className="text-sm text-neutral-500">불러오는 중...</p>}>
          <CheckoutClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
