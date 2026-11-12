import Image from "next/image";
import { mp, mpAtmosphereStyle } from "@/lib/mypageTheme";

/** F 섹션 공통: 시안 우주 배경 (별 · 아나모픽 라이트 · 유성) */
export function CommerceAtmosphere({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={`${mp.page} ${className}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0" style={mpAtmosphereStyle} />
        <Image
          src="/figma/f-atmosphere/pin-prick-stars.svg"
          alt=""
          fill
          className="object-cover opacity-80"
          unoptimized
          priority={false}
        />
        <Image
          src="/figma/f-atmosphere/anamorphic-lights.svg"
          alt=""
          fill
          className="object-cover opacity-70"
          unoptimized
        />
        {/* Shooting stars — Figma F-06 */}
        <div className="absolute left-[8%] top-[18%] h-[1.5px] w-[230px] rotate-[-18deg] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.28)] to-[rgba(255,255,255,0.95)] shadow-[0_0_6px_rgba(199,214,245,0.6)]" />
        <div className="absolute left-[55%] top-[32%] h-[1.5px] w-[160px] rotate-[-22deg] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.21)] to-[rgba(255,255,255,0.7)] shadow-[0_0_6px_rgba(199,214,245,0.6)]" />
        <div className="absolute left-[28%] top-[62%] h-[1.5px] w-[180px] rotate-[-16deg] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.18)] to-[rgba(255,255,255,0.6)] shadow-[0_0_6px_rgba(199,214,245,0.6)]" />
        <div
          className="absolute left-[28px] top-[12%] h-[700px] w-[min(900px,90vw)] opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(142deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 36%, rgba(255,255,255,0) 71%)",
          }}
        />
      </div>
      <div className="relative">{children}</div>
    </main>
  );
}
