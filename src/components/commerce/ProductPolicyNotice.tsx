import Link from "next/link";
import {
  productDetailPolicyLinks,
  productDetailPolicySummary,
} from "@/data/usageGuide";

export function ProductPolicyNotice({ className = "" }: { className?: string }) {
  return (
    <div className={`border-t border-[rgba(244,241,234,0.12)] pt-10 ${className}`}>
      <h2 className="text-sm font-medium uppercase tracking-widest text-[#f4f1ea]">
        배송 · 교환 · 환불
      </h2>
      <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[#a8a49b]">
        {productDetailPolicySummary.map((line) => (
          <li key={line} className="flex gap-2">
            <span
              className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#6e6b65]"
              aria-hidden
            />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs leading-relaxed text-[#a8a49b]">
        자세한 내용은{" "}
        <Link href="/guide" className="text-[#f4f1ea] underline underline-offset-2">
          이용안내
        </Link>
        를 참고해 주세요.
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {productDetailPolicyLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-[#f4f1ea] underline underline-offset-2"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
