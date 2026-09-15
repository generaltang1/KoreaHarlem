"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HeroGalaxy } from "@/components/home/HeroGalaxy";

function SeoulClock() {
  const [text, setText] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const formatted = now.toLocaleString("en-US", {
        timeZone: "Asia/Seoul",
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      setText(`${formatted} SEOUL`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-300">
      {text || "— SEOUL"}
    </span>
  );
}

function ThermalOverlay({ targetRef }: { targetRef: React.RefObject<HTMLElement | null> }) {
  const glowRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = targetRef.current;
    const glow = glowRef.current;
    const core = coreRef.current;
    if (!hero || !glow || !core) return;

    let mouseX = 0;
    let mouseY = 0;
    let curX = 0;
    let curY = 0;
    let hovered = false;
    let frame = 0;

    const onEnter = (e: MouseEvent) => {
      hovered = true;
      glow.style.opacity = "1";
      core.style.opacity = "0.75";
      const rect = hero.getBoundingClientRect();
      curX = mouseX = e.clientX - rect.left;
      curY = mouseY = e.clientY - rect.top;
    };
    const onMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    const onLeave = () => {
      hovered = false;
      glow.style.opacity = "0";
      core.style.opacity = "0";
    };

    hero.addEventListener("mouseenter", onEnter);
    hero.addEventListener("mousemove", onMove);
    hero.addEventListener("mouseleave", onLeave);

    const render = () => {
      if (hovered) {
        curX += (mouseX - curX) * 0.12;
        curY += (mouseY - curY) * 0.12;
        glow.style.left = `${curX}px`;
        glow.style.top = `${curY}px`;
        core.style.left = `${curX}px`;
        core.style.top = `${curY}px`;
      }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      hero.removeEventListener("mouseenter", onEnter);
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseleave", onLeave);
    };
  }, [targetRef]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden>
      <div
        ref={glowRef}
        className="pointer-events-none absolute rounded-full opacity-0 transition-opacity duration-300"
        style={{
          width: 380,
          height: 380,
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(255, 31, 61, 0.85) 0%, rgba(255, 102, 0, 0.7) 22%, rgba(255, 223, 0, 0.55) 44%, rgba(43, 230, 89, 0.35) 62%, rgba(0, 210, 255, 0.2) 80%, rgba(26, 31, 113, 0.08) 92%, transparent 100%)",
          filter: "blur(34px)",
          mixBlendMode: "screen",
        }}
      />
      <div
        ref={coreRef}
        className="pointer-events-none absolute rounded-full opacity-0 transition-opacity duration-200"
        style={{
          width: 140,
          height: 140,
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgb(255, 255, 255) 0%, rgb(255, 31, 61) 45%, rgb(255, 102, 0) 80%, transparent 100%)",
          filter: "blur(18px)",
          mixBlendMode: "color-dodge",
        }}
      />
    </div>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <>
      <section
        ref={sectionRef}
        className="relative flex min-h-[580px] items-end overflow-hidden border-b border-neutral-800 bg-black lg:min-h-[720px]"
        data-purpose="hero-cover-story"
      >
        <HeroGalaxy />
        <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent,rgba(0,0,0,0.1)_40%,rgba(0,0,0,0.7)_100%)]" />
        </div>
        <ThermalOverlay targetRef={sectionRef} />

        <div className="relative z-20 mx-auto w-full max-w-[1720px] px-6 pb-16 pt-16 sm:px-10 sm:pt-24">
          <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
            <div className="max-w-4xl space-y-4">
              <h1 className="text-3xl font-black leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-7xl">
                koreaharlem 2026
              </h1>
              <p className="max-w-2xl pt-2 text-sm font-normal leading-relaxed text-neutral-300 sm:text-base">
                대한민국의 일상 속 가벼운 문화와 현상을 기록합니다.
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-4 lg:items-end">
              <Link
                href="#magazine-section"
                className="group flex items-center gap-3 rounded-full bg-neutral-100 px-7 py-3.5 text-sm font-bold text-black shadow-2xl transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-cyan-500/20 sm:text-base"
              >
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black">
                  <span className="h-1.5 w-1.5 rounded-full bg-white transition-transform group-hover:scale-125" />
                </span>
                <span>자세히 확인하기</span>
                <span aria-hidden className="text-xs transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="flex w-full select-none items-center justify-center border-b border-neutral-900 bg-[#0a0a0c] px-4 py-1.5">
        <div className="inline-flex items-center justify-center gap-2 font-mono text-[10px] tracking-widest text-neutral-400">
          <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-white" />
          <SeoulClock />
        </div>
      </div>
    </>
  );
}
