import Link from "next/link";
import Image from "next/image";

/**
 * 히어로 배경은 나중에 동영상/다른 이미지로 교체할 수 있도록
 * 미디어 레이어를 분리해 둡니다.
 */
export function Hero() {
  return (
    <section className="relative flex min-h-[70vh] items-end overflow-hidden bg-black md:min-h-[85vh]">
      {/* Media layer — 초안: 단색. 이후 video/image 교체 */}
      <div className="absolute inset-0 bg-black" aria-hidden />

      <div className="relative z-10 w-full px-5 pb-12 pt-24 text-left text-white md:px-10 md:pb-16 lg:px-14">
        <div className="max-w-xl">
          <p className="text-sm font-medium leading-none tracking-tight text-white md:text-[15px]">
            문화와 현상을 아카이빙
          </p>

          {/* 여백 자른 워드마크 — 글자와 바로 붙도록 mt 최소화 */}
          <div className="mt-1 w-[min(88vw,420px)] md:mt-1.5 md:w-[min(70vw,520px)]">
            <Image
              src="/logo-wordmark.png"
              alt="koreaharlem"
              width={2959}
              height={445}
              priority
              className="h-auto w-full object-contain object-left"
            />
          </div>

          <Link
            href="#home-sections"
            className="mt-5 inline-flex items-center border border-white/60 bg-black/30 px-6 py-2.5 text-[11px] uppercase tracking-widest text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-black md:mt-6 md:px-7 md:py-3 md:text-xs"
          >
            Explore Now →
          </Link>
        </div>
      </div>
    </section>
  );
}
