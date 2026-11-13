import Image from "next/image";
import Link from "next/link";
import { music as m } from "@/lib/musicTheme";

export type MusicTabKey = "home" | "artists" | "albums" | "dj-set";

const TABS: { key: MusicTabKey; href: string; label: string; latin: boolean }[] = [
  { key: "home", href: "/music", label: "MUSIC HOME", latin: true },
  { key: "artists", href: "/artists", label: "아티스트", latin: false },
  { key: "albums", href: "/music/albums", label: "음반", latin: false },
  { key: "dj-set", href: "/music/dj-set", label: "DJ SET", latin: true },
];

const display = "[font-family:var(--font-f-display),var(--font-f-sans),sans-serif]";
const mono = "font-mono";

/** E-05 / E-06 공통: Figma 우주 배경 + 브레드크럼 + 마스트헤드 + 뮤직 탭 */
export function MusicArchiveShell({
  active,
  crumb,
  title,
  titleStyle,
  sub,
  count,
  children,
}: {
  active: MusicTabKey;
  crumb: string;
  title: string;
  titleStyle: "korean" | "display";
  sub: string;
  count: string;
  children: React.ReactNode;
}) {
  return (
    <main className={`relative isolate overflow-hidden ${m.page} ${m.font}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 40% 30% at 50% 20%, rgba(30,41,59,0.4), transparent), radial-gradient(ellipse 35% 28% at 15% 70%, rgba(20,25,35,0.6), transparent), radial-gradient(ellipse 30% 25% at 85% 60%, rgba(25,20,35,0.5), transparent)",
          }}
        />
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
        <div className="absolute left-[11%] top-[70px] h-[1.5px] w-[230px] rotate-[24deg] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.28)] to-[rgba(255,255,255,0.95)] shadow-[0_0_6px_rgba(199,214,245,0.6)]" />
        <div className="absolute left-[48%] top-[30px] h-[1.5px] w-[160px] rotate-[24deg] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.21)] to-[rgba(255,255,255,0.7)] shadow-[0_0_6px_rgba(199,214,245,0.6)]" />
        <div className="absolute left-[5%] top-[62%] h-[1.5px] w-[180px] rotate-[24deg] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.18)] to-[rgba(255,255,255,0.6)] shadow-[0_0_6px_rgba(199,214,245,0.6)]" />
        <div
          className="absolute left-[28px] top-[179px] h-[700px] w-[min(900px,90vw)]"
          style={{
            backgroundImage:
              "linear-gradient(142deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 36%, rgba(255,255,255,0) 71%)",
          }}
        />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1280px] flex-col gap-9 px-4 pb-24 pt-10 sm:px-8 lg:px-14">
        <nav
          aria-label="breadcrumb"
          className="flex items-start gap-2.5 text-[11px] font-medium"
        >
          <Link
            href="/music"
            className={`${mono} tracking-[1.5px] text-[#a8a49b] transition hover:text-[#f4f1ea]`}
          >
            MUSIC
          </Link>
          <span className={`${mono} text-[#6e6b65]`}>/</span>
          <span
            className={`text-[#f4f1ea] ${crumb === "DJ SET" ? `${mono} tracking-[1.5px]` : ""}`}
          >
            {crumb}
          </span>
        </nav>

        <header className="flex flex-col gap-2.5">
          <h1
            className={`leading-none text-[#f4f1ea] ${
              titleStyle === "display"
                ? `${display} text-[48px] font-bold tracking-[-1px] sm:text-[64px] lg:text-[80px]`
                : "text-[56px] font-normal sm:text-[68px] lg:text-[80px]"
            }`}
          >
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 font-medium">
            <p className="text-[17px] text-[#a8a49b]">{sub}</p>
            <p className={`${mono} text-[12px] tracking-[1.5px] text-[#fbc201]`}>{count}</p>
          </div>
        </header>

        <div className="flex flex-wrap items-start gap-x-8 gap-y-2 border-b border-[#262626]">
          {TABS.map((tab) => {
            const on = tab.key === active;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                aria-current={on ? "page" : undefined}
                className={`-mb-px pb-3.5 text-[14px] font-bold transition-colors ${
                  tab.latin ? `${display} tracking-[1.5px]` : ""
                } ${
                  on
                    ? "border-b-2 border-[#f4f1ea] text-[#f4f1ea]"
                    : "border-b-2 border-transparent text-[#6e6b65] hover:text-[#f4f1ea]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {children}
      </div>
    </main>
  );
}
