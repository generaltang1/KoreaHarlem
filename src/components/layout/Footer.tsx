"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { PrivacyModal } from "@/components/ui/PrivacyModal";
import { TermsModal } from "@/components/ui/TermsModal";
import { UsageGuideModal } from "@/components/ui/UsageGuideModal";
import { TipReportModal } from "@/components/tips/TipReportModal";
import {
  footerMagazineLinks,
  footerMusicLinks,
  footerStoreLinks,
} from "@/data/navigation";

const footerLinks = {
  store: footerStoreLinks,
  music: footerMusicLinks,
  magazine: footerMagazineLinks,
  help: [
    { label: "문의하기", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "배송 안내", href: "/guide#shipping" },
  ],
  info: [{ label: "소개", href: "/about" }],
};

const footerSectionLabels: Record<string, string> = {
  store: "In Store",
  music: "Music",
  magazine: "Magazine",
  help: "Help",
  info: "Info",
};

function TipBlock({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="flex h-full flex-col border border-neutral-800 bg-neutral-950 p-6 text-neutral-100 md:p-8">
      <h3 className="text-xl font-black uppercase tracking-wider md:text-2xl">제보하기</h3>
      <p className="mt-3 text-sm leading-relaxed text-neutral-400">
        보내주신 제보는 코리아할렘에서 검토한 후 아카이브 및 매거진에 반영될 수 있습니다.
        회원·비회원 모두 가능합니다.
      </p>
      <button
        type="button"
        onClick={onOpen}
        className="mt-auto inline-flex w-full items-center justify-center bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-neutral-200 md:mt-8"
      >
        제보 제출하기
      </button>
    </div>
  );
}

export function Footer() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-neutral-800 bg-[#0a0a0c] text-neutral-100">
        <div className="mx-auto max-w-[1720px] px-4 py-16 sm:px-8">
          {/* 모바일: 제보하기 먼저 */}
          <div className="mb-12 md:hidden">
            <TipBlock onOpen={() => setTipOpen(true)} />
          </div>

          <div className="grid gap-12 lg:grid-cols-[1.4fr_0.8fr]">
            <div>
              <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
                <div className="col-span-2 md:col-span-1">
                  <Link href="/" className="inline-block">
                    <Image
                      src="/logo-wordmark.png"
                      alt="koreaharlem"
                      width={296}
                      height={45}
                      className="h-5 w-auto object-contain md:h-6"
                    />
                  </Link>
                  <p className="mt-3 text-xs leading-relaxed text-neutral-500">
                    한국과 할렘을 잇는
                    <br />
                    종합 예술 플랫폼
                  </p>
                  <Link
                    href="/think"
                    className="mt-4 inline-block text-xs text-neutral-500 transition-colors hover:text-white"
                  >
                    Think
                  </Link>
                </div>

                {Object.entries(footerLinks).map(([key, links]) => (
                  <div key={key}>
                    <p className="mb-4 text-[10px] font-medium uppercase tracking-widest text-neutral-400">
                      {footerSectionLabels[key]}
                    </p>
                    <ul className="space-y-2">
                      {links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className="text-xs text-neutral-500 transition-colors hover:text-white"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                      {key === "info" && (
                        <>
                          <li>
                            <button
                              onClick={() => setGuideOpen(true)}
                              className="text-xs text-neutral-500 transition-colors hover:text-white"
                            >
                              이용안내
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => setTermsOpen(true)}
                              className="text-xs text-neutral-500 transition-colors hover:text-white"
                            >
                              이용약관
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => setPrivacyOpen(true)}
                              className="text-xs text-neutral-500 transition-colors hover:text-white"
                            >
                              개인정보처리방침
                            </button>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-12 space-y-1 border-t border-neutral-800 pt-8 text-[10px] leading-relaxed text-neutral-500">
                <p>
                  <span className="font-medium text-neutral-300">koreaharlem</span>
                  &nbsp;|&nbsp;대표자 : 장재혁
                  &nbsp;|&nbsp;사업자등록번호 : 569-09-02645
                  &nbsp;|&nbsp;통신판매업신고번호 : 2024-서울마포-2977
                </p>
                <p>주소 : 서울 마포구 동교로 183-6, 104호 (동교동)</p>
                <p>
                  전화 :{" "}
                  <a href="tel:010-5828-5171" className="hover:text-white">
                    010-5828-5171
                  </a>
                  &nbsp;|&nbsp;이메일 : koreaharlem@gmail.com
                </p>
                <p className="pt-2">© {new Date().getFullYear()} koreaharlem. All rights reserved.</p>
              </div>
            </div>

            {/* 데스크톱: 우측 제보하기 */}
            <div className="hidden md:block">
              <TipBlock onOpen={() => setTipOpen(true)} />
            </div>
          </div>
        </div>
      </footer>

      {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
      {termsOpen && <TermsModal onClose={() => setTermsOpen(false)} />}
      {guideOpen && <UsageGuideModal onClose={() => setGuideOpen(false)} />}
      {tipOpen && <TipReportModal onClose={() => setTipOpen(false)} />}
    </>
  );
}
