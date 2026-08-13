"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { PrivacyModal } from "@/components/ui/PrivacyModal";
import { TermsModal } from "@/components/ui/TermsModal";
import { UsageGuideModal } from "@/components/ui/UsageGuideModal";
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

export function Footer() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-5 md:gap-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="inline-block">
                <Image
                  src="/logo-wordmark.png"
                  alt="koreaharlem"
                  width={296}
                  height={45}
                  className="h-5 w-auto object-contain invert md:h-6"
                />
              </Link>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                한국과 할렘을 잇는
                <br />
                종합 예술 플랫폼
              </p>
              <Link
                href="/think"
                className="mt-4 inline-block text-xs text-muted transition-colors hover:text-foreground"
              >
                Think
              </Link>
            </div>

            {Object.entries(footerLinks).map(([key, links]) => (
              <div key={key}>
                <p className="mb-4 text-[10px] font-medium uppercase tracking-widest">
                  {footerSectionLabels[key]}
                </p>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-xs text-muted transition-colors hover:text-foreground"
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
                          className="text-xs text-muted transition-colors hover:text-foreground"
                        >
                          이용안내
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => setTermsOpen(true)}
                          className="text-xs text-muted transition-colors hover:text-foreground"
                        >
                          이용약관
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => setPrivacyOpen(true)}
                          className="text-xs text-muted transition-colors hover:text-foreground"
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

          <div className="mt-16 border-t border-border pt-12">
            <p className="text-[10px] font-medium uppercase tracking-widest">Newsletter</p>
            <p className="mt-2 text-xs text-muted">새로운 작품과 이벤트 소식을 받아보세요.</p>
            <form className="mt-4 flex max-w-md flex-col gap-2 sm:flex-row">
              <input
                type="email"
                placeholder="이메일 주소"
                className="flex-1 border border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-foreground sm:py-2.5 sm:text-xs"
              />
              <button
                type="submit"
                className="bg-foreground px-6 py-3 text-sm uppercase tracking-widest text-background transition-opacity hover:opacity-80 sm:py-2.5 sm:text-xs"
              >
                Submit
              </button>
            </form>
          </div>

          <div className="mt-12 border-t border-border pt-8">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[10px] text-muted">
              <button
                onClick={() => setGuideOpen(true)}
                className="transition-colors hover:text-foreground"
              >
                이용안내
              </button>
              <button
                onClick={() => setTermsOpen(true)}
                className="transition-colors hover:text-foreground"
              >
                이용약관
              </button>
              <button
                onClick={() => setPrivacyOpen(true)}
                className="transition-colors hover:text-foreground"
              >
                개인정보처리방침
              </button>
              <Link href="/contact" className="transition-colors hover:text-foreground">
                문의하기
              </Link>
            </div>

            <div className="mt-4 space-y-1 text-[10px] leading-relaxed text-muted">
              <p>
                <span className="font-medium text-foreground">KoreaHarlem</span>
                &nbsp;|&nbsp;사업자등록번호 : 569-09-02645&nbsp;|&nbsp;통신판매업신고번호 : 2024-서울마포-2977
              </p>
              <p>대표자 이메일 : koreaharlem@gmail.com</p>
            </div>

            <p className="mt-4 text-[10px] text-muted">
              © {new Date().getFullYear()} KoreaHarlem. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {termsOpen && <TermsModal onClose={() => setTermsOpen(false)} />}
      {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
      {guideOpen && <UsageGuideModal onClose={() => setGuideOpen(false)} />}
    </>
  );
}
