import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { mpAtmosphereStyle } from "@/lib/mypageTheme";

interface AuthDarkShellProps {
  children: React.ReactNode;
  /** 카드 밖 넓은 레이아웃 (About/고객센터) */
  wide?: boolean;
  maxWidthClassName?: string;
}

export function AuthDarkShell({
  children,
  wide = false,
  maxWidthClassName,
}: AuthDarkShellProps) {
  const width =
    maxWidthClassName ?? (wide ? "max-w-[1120px]" : "max-w-[420px]");

  return (
    <>
      <Header />
      <main className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-[#0a0a0a] px-4 py-16 text-[#f4f1ea] sm:px-8 [font-family:var(--font-f-sans),var(--font-geist-sans),sans-serif]">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0" style={mpAtmosphereStyle} />
          <Image
            src="/figma/f-atmosphere/pin-prick-stars.svg"
            alt=""
            fill
            className="object-cover opacity-80"
            unoptimized
          />
          <Image
            src="/figma/f-atmosphere/anamorphic-lights.svg"
            alt=""
            fill
            className="object-cover opacity-70"
            unoptimized
          />
          <div className="absolute left-[10%] top-[22%] h-[1.5px] w-[200px] rotate-[-18deg] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.25)] to-[rgba(255,255,255,0.9)] shadow-[0_0_6px_rgba(199,214,245,0.6)]" />
          <div className="absolute left-[58%] top-[40%] h-[1.5px] w-[140px] rotate-[-22deg] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.2)] to-[rgba(255,255,255,0.65)] shadow-[0_0_6px_rgba(199,214,245,0.6)]" />
        </div>
        <div className={`relative w-full ${width}`}>{children}</div>
      </main>
      <Footer />
    </>
  );
}

export function AuthCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[12px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)] p-7 shadow-[0_0_60px_rgba(0,0,0,0.45)] backdrop-blur-[6px] sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}

export const authInputClass =
  "w-full rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)] px-3 py-3.5 text-sm text-[#f4f1ea] outline-none placeholder:text-[#6e6b65] focus:border-[rgba(244,241,234,0.35)]";

export const authPrimaryBtnClass =
  "w-full rounded-[8px] bg-[#FEE500] py-3.5 text-sm font-semibold text-[#191919] transition-opacity hover:opacity-90 disabled:opacity-50";

export const authSecondaryBtnClass =
  "w-full rounded-[6px] border border-[rgba(244,241,234,0.12)] bg-transparent py-3.5 text-sm text-[#f4f1ea] transition-colors hover:bg-[rgba(244,241,234,0.06)] disabled:opacity-50";
