"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TipReportModal } from "@/components/tips/TipReportModal";
import { CommerceAtmosphere } from "@/components/mypage/CommerceAtmosphere";
import { mp } from "@/lib/mypageTheme";
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
      <CommerceAtmosphere>
        <div className="relative mx-auto max-w-[1120px] px-4 py-16 sm:px-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">고객센터</h1>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Link
              href="/order-inquiry"
              className={`${mp.card} p-5 transition-colors hover:border-[rgba(251,194,1,0.45)]`}
            >
              <p className="font-semibold">비회원 주문조회</p>
              <p className="mt-2 text-xs text-[#a8a49b]">이름 · 주문번호 · 비밀번호</p>
              <p className="mt-4 text-xs font-medium text-[#FEE500]">바로가기 →</p>
            </Link>
            <Link
              href="/guide#exchange"
              className={`${mp.card} p-5 transition-colors hover:border-[rgba(251,194,1,0.45)]`}
            >
              <p className="font-semibold">교환 · 반품 신청</p>
              <p className="mt-2 text-xs text-[#a8a49b]">받은 날부터 7일 이내</p>
              <p className="mt-4 text-xs font-medium text-[#FEE500]">바로가기 →</p>
            </Link>
            <button
              type="button"
              onClick={() => setTipOpen(true)}
              className={`${mp.card} p-5 text-left transition-colors hover:border-[rgba(251,194,1,0.45)]`}
            >
              <p className="font-semibold">제보하기</p>
              <p className="mt-2 text-xs text-[#a8a49b]">로그인 없이 · 익명</p>
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
                className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${
                  tab === t
                    ? "border border-[#fbc201] bg-[rgba(251,194,1,0.08)] font-medium text-[#fbc201]"
                    : "border border-[rgba(244,241,234,0.12)] text-[#a8a49b] hover:bg-[rgba(244,241,234,0.06)] hover:text-[#f4f1ea]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div id="faq" className="mt-4 space-y-3">
            {items.map((item) => {
              const open = openId === item.id;
              return (
                <div key={item.id} className={`${mp.card} px-5 py-4 ${open ? "border-[rgba(251,194,1,0.35)]" : ""}`}>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : item.id)}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <span className="shrink-0 text-[10px] tracking-wider text-[#6e6b65]">
                      {item.category}
                    </span>
                    <span className="flex-1 text-[15px] font-medium text-[#f4f1ea]">
                      {item.question}
                    </span>
                    <span className="text-lg text-[#6e6b65]">{open ? "−" : "+"}</span>
                  </button>
                  {open && (
                    <p className="mt-3 border-t border-[rgba(244,241,234,0.12)] pt-3 text-sm leading-relaxed text-[#f4f1ea]/85">
                      {item.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <h2 className="mt-14 text-xl font-bold">1:1 문의</h2>
          <div className={`mt-5 space-y-4 ${mp.card} p-6 text-sm`}>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-6">
              <p className="w-28 shrink-0 text-[#a8a49b]">문의 채널</p>
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
              <p className="w-28 shrink-0 text-[#a8a49b]">운영 시간</p>
              <p className="text-[#f4f1ea]/85">평일 11:00 – 18:00 (주말·공휴일 휴무)</p>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-6">
              <p className="w-28 shrink-0 text-[#a8a49b]">사업자 정보</p>
              <p className="leading-relaxed text-[#f4f1ea]/85">
                상호 koreaharlem · 대표 장재혁 · 사업자등록번호 569-09-02645 · 통신판매업
                2024-서울마포-2977 · 서울 마포구 동교로 183-6, 104호 (동교동) ·
                010-5828-5171 · koreaharlem@gmail.com
              </p>
            </div>
          </div>
        </div>
      </CommerceAtmosphere>
      <Footer />
      {tipOpen && <TipReportModal onClose={() => setTipOpen(false)} />}
    </>
  );
}
