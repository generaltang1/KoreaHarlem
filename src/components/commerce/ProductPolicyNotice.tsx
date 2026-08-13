import Link from "next/link";
import {
  productDetailPolicyLinks,
  productDetailPolicySummary,
} from "@/data/usageGuide";

export function ProductPolicyNotice() {
  return (
    <div className="mt-16 border-t border-border pt-10">
      <h2 className="text-sm font-medium uppercase tracking-widest">배송 · 교환 · 환불</h2>
      <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
        {productDetailPolicySummary.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs leading-relaxed text-muted">
        자세한 내용은{" "}
        <Link href="/guide" className="text-foreground underline">
          이용안내
        </Link>
        를 참고해 주세요.
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {productDetailPolicyLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-foreground underline underline-offset-2"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
