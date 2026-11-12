"use client";

import { useEffect } from "react";
import { site } from "@/lib/siteTheme";

interface MarketingConsentModalProps {
  onClose: () => void;
}

export function MarketingConsentModal({ onClose }: MarketingConsentModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-[4px]"
      onClick={onClose}
    >
      <div
        className={`relative max-h-[85vh] w-full max-w-lg overflow-y-auto ${site.glassModal} ${site.font} text-[#f4f1ea]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between rounded-t-[20px] border-b border-[rgba(244,241,234,0.12)] bg-[#141414]/95 px-6 py-4 backdrop-blur-[10px]">
          <h2 className="text-sm font-medium">마케팅 정보 수신 동의</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] px-2.5 py-1 text-xs text-[#a8a49b] transition-colors hover:bg-[rgba(244,241,234,0.06)] hover:text-[#f4f1ea]"
            aria-label="닫기"
          >
            닫기
          </button>
        </div>
        <div className="space-y-4 px-6 py-6 text-xs leading-7 text-[#f4f1ea]/85">
          <p>
            koreaharlem은 이벤트·파티·신상품·프로모션 소식을 이메일 또는 알림으로
            안내할 수 있습니다. 본 동의는 선택 사항이며, 동의하지 않아도 회원가입과
            서비스 이용이 가능합니다.
          </p>
          <h3 className="font-medium text-[#f4f1ea]">수신 항목</h3>
          <ul className="list-disc space-y-1 pl-4">
            <li>파티·공연·팝업 등 이벤트 소식</li>
            <li>신상품·음원·티켓 출시 안내</li>
            <li>할인·프로모션·멤버십 혜택 안내</li>
          </ul>
          <h3 className="font-medium text-[#f4f1ea]">철회 방법</h3>
          <p>
            동의 후에도 마이페이지 또는 고객센터(koreaharlem@gmail.com)를 통해
            언제든지 수신을 거부할 수 있습니다.
          </p>
          <p className="text-[#6e6b65]">
            관련 법령: 정보통신망법 제50조, 개인정보 보호법
          </p>
        </div>
      </div>
    </div>
  );
}
