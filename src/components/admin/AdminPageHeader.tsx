import Link from "next/link";

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
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200 pb-6">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">{title}</h1>
        {description ? <p className="mt-2 text-sm text-neutral-500">{description}</p> : null}
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
        <div
          key={item.label}
          className="rounded-lg border border-neutral-200 bg-white px-4 py-4 shadow-sm"
        >
          <p className="text-[10px] uppercase tracking-widest text-neutral-500">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-neutral-900">{item.value}</p>
          {item.hint ? <p className="mt-1 text-xs text-neutral-400">{item.hint}</p> : null}
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
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-xs font-medium uppercase tracking-widest text-white transition hover:bg-neutral-700"
    >
      {children}
    </Link>
  );
}
