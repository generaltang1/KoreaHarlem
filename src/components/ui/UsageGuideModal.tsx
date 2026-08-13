"use client";

import { useEffect } from "react";
import { UsageGuideContent } from "@/components/guide/UsageGuideContent";

interface UsageGuideModalProps {
  onClose: () => void;
}

export function UsageGuideModal({ onClose }: UsageGuideModalProps) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <h2 className="text-sm font-medium">이용안내</h2>
          <button
            onClick={onClose}
            className="text-xs text-muted transition-colors hover:text-foreground"
            aria-label="닫기"
          >
            닫기
          </button>
        </div>
        <div className="px-6 py-6">
          <UsageGuideContent />
        </div>
      </div>
    </div>
  );
}
