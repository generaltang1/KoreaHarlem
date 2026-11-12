import Link from "next/link";
import { admin } from "@/lib/adminTheme";

type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function AdminPageHeader({
  eyebrow = "Admin",
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[#e8e8e8] pb-6">
      <div>
        <p className={admin.label}>{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#0a0a0a]">{title}</h1>
        {description ? <p className={`mt-2 text-sm ${admin.muted}`}>{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminKpiRow({
  items,
}: {
  items: { label: string; value: string | number; hint?: string }[];
}) {
  return (
    <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className={`${admin.card} px-4 py-4`}>
          <p className={admin.label}>{item.label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-[#0a0a0a]">{item.value}</p>
          {item.hint ? <p className={`mt-1 text-xs ${admin.muted}`}>{item.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function AdminPrimaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={admin.btnPrimary}>
      {children}
    </Link>
  );
}

export function AdminGhostButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={admin.btnGhost}>
      {children}
    </Link>
  );
}
