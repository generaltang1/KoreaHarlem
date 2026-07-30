"use client";

import Script from "next/script";
import { useCallback, useState } from "react";

declare global {
  interface Window {
    daum?: {
      Postcode: new (opts: {
        oncomplete: (data: {
          zonecode: string;
          address: string;
          roadAddress: string;
          jibunAddress: string;
        }) => void;
        width?: string;
        height?: string;
      }) => { open: () => void };
    };
  }
}

interface DaumPostcodeButtonProps {
  onComplete: (data: { postcode: string; address: string }) => void;
  className?: string;
}

export function DaumPostcodeButton({ onComplete, className }: DaumPostcodeButtonProps) {
  const [ready, setReady] = useState(false);

  const openSearch = useCallback(() => {
    if (!window.daum?.Postcode) return;
    new window.daum.Postcode({
      oncomplete: (data) => {
        onComplete({
          postcode: data.zonecode,
          address: data.roadAddress || data.address,
        });
      },
    }).open();
  }, [onComplete]);

  return (
    <>
      <Script
        src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="lazyOnload"
        onLoad={() => setReady(true)}
      />
      <button
        type="button"
        onClick={openSearch}
        disabled={!ready}
        className={
          className ??
          "shrink-0 border border-border bg-neutral-100 px-4 py-3 text-xs uppercase tracking-widest disabled:opacity-50"
        }
      >
        주소검색
      </button>
    </>
  );
}
