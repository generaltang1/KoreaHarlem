import Image from "next/image";
import { mag } from "@/lib/magazineTheme";

/** C Magazine 공개면 — 시안 네뷸라/글래스 대기 */
export function MagazineShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={`${mag.page} ${className}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 50% 40% at 50% 20%, rgba(30,41,59,0.4), transparent 60%), radial-gradient(ellipse 40% 35% at 15% 70%, rgba(20,25,35,0.55), transparent 55%), radial-gradient(ellipse 35% 30% at 85% 60%, rgba(25,20,35,0.45), transparent 55%)",
          }}
        />
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
        <div className="absolute left-[8%] top-[12%] h-[1.5px] w-[230px] rotate-[-18deg] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.28)] to-[rgba(255,255,255,0.95)] shadow-[0_0_6px_rgba(199,214,245,0.6)]" />
        <div className="absolute left-[48%] top-[8%] h-[1.5px] w-[160px] rotate-[-22deg] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.21)] to-[rgba(255,255,255,0.7)] shadow-[0_0_6px_rgba(199,214,245,0.6)]" />
        <div className="absolute left-[22%] top-[72%] h-[1.5px] w-[180px] rotate-[-16deg] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.18)] to-[rgba(255,255,255,0.6)] shadow-[0_0_6px_rgba(199,214,245,0.6)]" />
        <div
          className="absolute left-[28px] top-[10%] h-[700px] w-[min(900px,90vw)] opacity-50"
          style={{
            backgroundImage:
              "linear-gradient(142deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 36%, rgba(255,255,255,0) 71%)",
          }}
        />
      </div>
      <div className="relative z-[1]">{children}</div>
    </main>
  );
}
