import { mp, mpAtmosphereStyle } from "@/lib/mypageTheme";

/** F 섹션 공통: 우주/네뷸라 배경 셸 */
export function CommerceAtmosphere({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={`${mp.page} ${className}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0" style={mpAtmosphereStyle} />
      <div className="relative">{children}</div>
    </main>
  );
}
