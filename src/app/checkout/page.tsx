import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CheckoutClient } from "@/components/commerce/CheckoutClient";

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10 pb-24 md:px-6">
        <Suspense fallback={<p className="text-sm text-muted">불러오는 중...</p>}>
          <CheckoutClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
