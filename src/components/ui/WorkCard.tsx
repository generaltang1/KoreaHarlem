import Link from "next/link";
import type { Work } from "@/data/home";
import { categoryLabels } from "@/data/home";

interface WorkCardProps {
  work: Work;
  showCategory?: boolean;
}

export function WorkCard({ work, showCategory = false }: WorkCardProps) {
  return (
    <Link href={`/works/${work.id}`} className="group block">
      <div
        className={`relative aspect-[3/4] overflow-hidden bg-gradient-to-br ${work.image}`}
      >
        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
        {work.salePrice && (
          <span className="absolute left-3 top-3 bg-foreground px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-background">
            Sale
          </span>
        )}
      </div>
      <div className="mt-3 space-y-1">
        {showCategory && (
          <p className="text-[10px] uppercase tracking-widest text-muted">
            {categoryLabels[work.category]}
          </p>
        )}
        <h3 className="text-sm font-medium leading-snug">{work.title}</h3>
        <p className="text-xs text-muted">{work.artist}</p>
        {work.price && (
          <div className="flex items-center gap-2 pt-0.5">
            {work.salePrice ? (
              <>
                <span className="text-sm font-medium">{work.salePrice}</span>
                <span className="text-xs text-muted line-through">
                  {work.price}
                </span>
              </>
            ) : (
              <span className="text-sm font-medium">{work.price}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
