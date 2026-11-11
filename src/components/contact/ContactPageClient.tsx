"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TipReportModal } from "@/components/tips/TipReportModal";
import { FAQ_ITEMS, FAQ_TABS } from "@/data/faq";

export function ContactPageClient() {
  const [tab, setTab] = useState<(typeof FAQ_TABS)[number]>("전체");
  const [openId, setOpenId] = useState<string | null>("ship-1");
  const [tipOpen, setTipOpen] = useState(false);

  const items = useMemo(
    () => (tab === "전체" ? FAQ_ITEMS : FAQ_ITEMS.filter((i) => i.category === tab)),
    [tab],
  );

  return (
    <>
      <Header />
      <main className="relative min-h-[70vh] overflow-hidden bg-[#0a0a0a] text-neutral-100">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 55% 35% at 50% 0%, rgba(30,41,59,0.4), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-[1120px] px-4 py-16 sm:px-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">고객센터</h1>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Link
              href="/order-inquiry"
              className="rounded-xl border border-[#262626] bg-[#151515] p-5 transition-colors hover:border-neutral-500"
            >
              <p className="font-semibold">비회원 주문조회</p>
              <p className="mt-2 text-xs text-neutral-400">이름 · 주문번호 · 비밀번호</p>
              <p className="mt-4 text-xs font-medium text-[#FEE500]">바로가기 →</p>
            </Link>
            <Link
              href="/guide#exchange"
              className="rounded-xl border border-[#262626] bg-[#151515] p-5 transition-colors hover:border-neutral-500"
            >
              <p className="font-semibold">교환 · 반품 신청</p>
              <p className="mt-2 text-xs text-neutral-400">받은 날부터 7일 이내</p>
              <p className="mt-4 text-xs font-medium text-[#FEE500]">바로가기 →</p>
            </Link>
            <button
              type="button"
              onClick={() => setTipOpen(true)}
              className="rounded-xl border border-[#262626] bg-[#151515] p-5 text-left transition-colors hover:border-neutral-500"
            >
              <p className="font-semibold">제보하기</p>
              <p className="mt-2 text-xs text-neutral-400">로그인 없이 · 익명</p>
              <p className="mt-4 text-xs font-medium text-[#FEE500]">바로가기 →</p>
            </button>
          </div>

          <h2 className="mt-14 text-xl font-bold">자주 묻는 질문</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {FAQ_TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3.5 py-1.5 text-xs transition-colors ${
                  tab === t
                    ? "bg-[#f4f1ea] text-black"
                    : "border border-[#333] text-neutral-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div id="faq" className="mt-4">
            {items.map((item) => {
              const open = openId === item.id;
              return (
                <div key={item.id} className="border-b border-[#262626] py-4">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : item.id)}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <span className="shrink-0 text-[10px] tracking-wider text-neutral-500">
                      {item.category}
                    </span>
                    <span className="flex-1 text-[15px] font-medium text-neutral-100">
                      {item.question}
                    </span>
                    <span className="text-lg text-neutral-500">{open ? "−" : "+"}</span>
                  </button>
                  {open && (
                    <p className="mt-3 pl-[4.5rem] text-sm leading-relaxed text-neutral-300 sm:pl-20">
                      {item.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <h2 className="mt-14 text-xl font-bold">1:1 문의</h2>
          <div className="mt-5 space-y-4 rounded-xl border border-[#262626] bg-[#151515] p-6 text-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-6">
              <p className="w-28 shrink-0 text-neutral-400">문의 채널</p>
              <p className="text-[#FEE500]">
                이메일{" "}
                <a href="mailto:koreaharlem@gmail.com" className="underline">
                  koreaharlem@gmail.com
                </a>
                {" · "}전화{" "}
                <a href="tel:010-5828-5171" className="underline">
                  010-5828-5171
                </a>
              </p>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-6">
              <p className="w-28 shrink-0 text-neutral-400">운영 시간</p>
              <p className="text-neutral-300">평일 11:00 – 18:00 (주말·공휴일 휴무)</p>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-6">
              <p className="w-28 shrink-0 text-neutral-400">사업자 정보</p>
              <p className="leading-relaxed text-neutral-300">
                상호 koreaharlem · 대표 장재혁 · 사업자등록번호 569-09-02645 · 통신판매업
                2024-서울마포-2977 · 서울 마포구 동교로 183-6, 104호 (동교동) ·
                010-5828-5171 · koreaharlem@gmail.com
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      {tipOpen && <TipReportModal onClose={() => setTipOpen(false)} />}
    </>
  );
}
