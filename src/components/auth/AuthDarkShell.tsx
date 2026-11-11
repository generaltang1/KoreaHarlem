import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

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
      <main className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-[#0a0a0a] px-4 py-16 text-neutral-100 sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(30,41,59,0.45), transparent 70%), radial-gradient(ellipse 40% 35% at 15% 70%, rgba(20,25,35,0.5), transparent 60%), radial-gradient(ellipse 35% 30% at 85% 60%, rgba(25,20,35,0.4), transparent 55%)",
          }}
        />
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
      className={`rounded-xl border border-[#262626] bg-[#151515] p-7 shadow-[0_0_60px_rgba(0,0,0,0.45)] sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}

export const authInputClass =
  "w-full border border-[#333] bg-[#0c0c0c] px-3 py-3.5 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-white";

export const authPrimaryBtnClass =
  "w-full bg-[#FEE500] py-3.5 text-sm font-semibold text-[#191919] transition-opacity hover:opacity-90 disabled:opacity-50";

export const authSecondaryBtnClass =
  "w-full border border-[#333] bg-[#1c1c1c] py-3.5 text-sm text-white transition-colors hover:border-neutral-500 disabled:opacity-50";
