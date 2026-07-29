"use client";

import Link from "next/link";
import { useState } from "react";
import { PrivacyModal } from "@/components/ui/PrivacyModal";
import { TermsModal } from "@/components/ui/TermsModal";

const footerLinks = {
  explore: [
    { label: "전체 작품", href: "/works" },
    { label: "아티스트", href: "/artists" },
    { label: "이벤트", href: "/events" },
    { label: "Sale", href: "/sale" },
  ],
  help: [
    { label: "문의하기", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "배송 안내", href: "/shipping" },
  ],
  info: [
    { label: "소개", href: "/about" },
  ],
};

export function Footer() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
            <div className="col-span-2 md:col-span-1">
              <p className="text-sm font-semibold uppercase tracking-[0.25em]">
                KoreaHarlem
              </p>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                한국과 하렘을 잇는
                <br />
                종합 예술 플랫폼
              </p>
            </div>

            {Object.entries(footerLinks).map(([key, links]) => (
              <div key={key}>
                <p className="mb-4 text-[10px] font-medium uppercase tracking-widest">
                  {key === "explore" ? "Explore" : key === "help" ? "Help" : "Info"}
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

          {/* Newsletter */}
          <div className="mt-16 border-t border-border pt-12">
            <p className="text-[10px] font-medium uppercase tracking-widest">
              Newsletter
            </p>
            <p className="mt-2 text-xs text-muted">
              새로운 작품과 이벤트 소식을 받아보세요.
            </p>
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

          {/* 회사 정보 */}
          <div className="mt-12 border-t border-border pt-8">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[10px] text-muted">
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
              <p>
                대표자 이메일 : koreaharlem@gmail.com
              </p>
              <p>
                포스닝 제공사 : (주)아임웹
              </p>
            </div>

            <p className="mt-4 text-[10px] text-muted">
              © {new Date().getFullYear()} KoreaHarlem. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {termsOpen && <TermsModal onClose={() => setTermsOpen(false)} />}
      {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
    </>
  );
}
