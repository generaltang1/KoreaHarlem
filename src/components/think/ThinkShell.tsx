import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CommerceAtmosphere } from "@/components/mypage/CommerceAtmosphere";

/** D THINK 공개면 공통 — Figma Website 다크·우주 배경 (F/G와 동일 토큰) */
export function ThinkShell({
  children,
  className = "",
  maxWidthClass = "max-w-5xl",
}: {
  children: React.ReactNode;
  className?: string;
  maxWidthClass?: string;
}) {
  return (
    <>
      <Header />
      <CommerceAtmosphere className={`px-4 py-12 pb-28 sm:px-8 ${className}`}>
        <div className={`relative mx-auto ${maxWidthClass}`}>{children}</div>
      </CommerceAtmosphere>
      <Footer />
    </>
  );
}
