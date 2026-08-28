import type { RepeatMode } from "@/lib/playerPreferences";

const SIZE = 26;
const STROKE = 1.85;

type IconProps = {
  className?: string;
};

/** 유튜브 뮤직 스타일 스피커 + 음파 */
export function PlayerVolumeIcon({
  muted,
  className = "",
}: {
  muted: boolean;
  className?: string;
}) {
  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M4.5 9.75v4.5h3.25L13.25 18.5V5.5L7.75 9.75H4.5z"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      {muted ? (
        <>
          <path
            d="M15.25 9.25l4.5 5.5M19.75 9.25l-4.5 5.5"
            stroke="currentColor"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <path
            d="M15.75 9.25a4.25 4.25 0 0 1 0 5.5"
            stroke="currentColor"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />
          <path
            d="M18 7a7 7 0 0 1 0 10"
            stroke="currentColor"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

/** 유튜브 뮤직 스타일 반복 — 넓은 사각 루프 + 가운데 ● / 1 */
export function PlayerRepeatIcon({
  mode,
  className = "",
}: {
  mode: RepeatMode;
  className?: string;
}) {
  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      {/* 넓은 사각 루프 (가운데 여백 넓게) */}
      <path
        d="M5.5 7 H15 L18.5 10.5 V16.5 H8.5 L5.5 13.5 V7"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 위쪽 오른쪽 화살표 (→) */}
      <path
        d="M15 7 18 4 15 7 18 10"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 아래쪽 왼쪽 화살표 (←) */}
      <path
        d="M8.5 16.5 5.5 19.5 8.5 16.5 5.5 13.5"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {mode === "all" && <circle cx="12" cy="12" r="1.6" fill="currentColor" />}
      {mode === "one" && (
        <text
          x="12"
          y="12.5"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="currentColor"
          fontSize="8.5"
          fontWeight="600"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          1
        </text>
      )}
    </svg>
  );
}

/** 유튜브 뮤직 스타일 셔플 (교차 화살표) */
export function PlayerShuffleIcon({ className = "" }: IconProps) {
  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M3.5 16.75h2.35c1.55 0 2.35-.85 3.05-1.55.7-.7 1.45-1.45 3-1.45s2.3.75 3 1.45c.7.7 1.5 1.55 3.05 1.55H20.5"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.75 14.75 20.5 16.75 17.75 18.75"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 7.25h2.35c1.55 0 2.35.85 3.05 1.55.7.7 1.45 1.45 3 1.45s2.3-.75 3-1.45c.7-.7 1.5-1.55 3.05-1.55H20.5"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.75 5.25 20.5 7.25 17.75 9.25"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function playerIconButtonClass(active?: boolean) {
  return `flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-80 sm:h-11 sm:w-11 ${
    active ? "text-foreground" : "text-muted/55"
  }`;
}
