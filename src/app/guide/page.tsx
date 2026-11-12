import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CommerceAtmosphere } from "@/components/mypage/CommerceAtmosphere";
import { UsageGuideContent } from "@/components/guide/UsageGuideContent";
import { mp } from "@/lib/mypageTheme";

export default function GuidePage() {
  return (
    <>
      <Header />
      <CommerceAtmosphere className="px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <p className={`text-[10px] uppercase tracking-widest ${mp.tertiary}`}>Guide</p>
          <h1 className="mt-1 text-[28px] font-bold tracking-tight text-[#f4f1ea]">이용안내</h1>
          <p className={`mt-3 text-sm ${mp.muted}`}>
            결제, 배송, 교환·반품, 환불에 관한 안내입니다.
          </p>
          <div className={`${mp.card} mt-10 p-6 sm:p-8`}>
            <div className="text-xs leading-7 text-[#a8a49b] [&_h3]:font-semibold [&_h3]:text-[#f4f1ea]">
              <UsageGuideContent />
            </div>
          </div>
          <Link href="/" className={`mt-10 inline-block text-xs ${mp.accent} underline`}>
            홈으로
          </Link>
        </div>
      </CommerceAtmosphere>
      <Footer />
    </>
  );
}
