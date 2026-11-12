import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CheckoutClient } from "@/components/commerce/CheckoutClient";
import { CommerceAtmosphere } from "@/components/mypage/CommerceAtmosphere";

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <CommerceAtmosphere className="px-4 py-10 pb-24 sm:px-8">
        <Suspense fallback={<p className="text-sm text-neutral-500">불러오는 중...</p>}>
          <CheckoutClient />
        </Suspense>
      </CommerceAtmosphere>
      <Footer />
    </>
  );
}
