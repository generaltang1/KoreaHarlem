import { extractYoutubeId, type MagazineBlock } from "@/lib/magazineBlocks";

export function MagazineBlockRenderer({ blocks }: { blocks: MagazineBlock[] }) {
  return (
    <div className="mx-auto max-w-[760px] space-y-7 text-[17px] leading-[1.65] text-[#f4f1ea]">
      {blocks.map((block) => (
        <Block key={block.id} block={block} />
      ))}
    </div>
  );
}

function Block({ block }: { block: MagazineBlock }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="whitespace-pre-wrap text-[#f4f1ea]">
          {(block.text ?? "").trim() || "\u00A0"}
        </p>
      );
    case "heading":
      return (
        <h2 className="text-[22px] font-bold tracking-tight text-[#f4f1ea]">
          {(block.text ?? "").trim() || "소제목"}
        </h2>
      );
    case "quote":
      return (
        <blockquote className="mx-auto max-w-[640px] border-y border-[rgba(244,241,234,0.18)] py-8 text-center">
          <p className="text-[22px] font-semibold leading-snug text-[#FEE500] sm:text-[26px]">
            “{(block.text ?? "").trim() || "인용문"}”
          </p>
          {block.credit ? (
            <cite className="mt-4 block text-sm not-italic text-[#a8a49b]">
              — {block.credit}
            </cite>
          ) : null}
        </blockquote>
      );
    case "image":
      if (!block.url) return null;
      return (
        <figure className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.url}
            alt={block.caption || ""}
            className="w-full rounded-[8px] object-cover"
          />
          {(block.caption || block.credit) && (
            <figcaption className="text-xs text-[#a8a49b]">
              {[block.caption, block.credit].filter(Boolean).join(" · ")}
            </figcaption>
          )}
        </figure>
      );
    case "youtube": {
      const id = extractYoutubeId(block.url ?? "");
      if (!id) return null;
      return (
        <div className="aspect-video overflow-hidden rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-black">
          <iframe
            title="YouTube"
            src={`https://www.youtube.com/embed/${id}`}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    case "link":
      if (!block.url) return null;
      return (
        <a
          href={block.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between gap-3 rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)] px-4 py-3 text-sm text-[#f4f1ea] transition-colors hover:border-[rgba(251,194,1,0.45)]"
        >
          <span className="truncate">{block.label || block.url}</span>
          <span className="shrink-0 text-[#FEE500]">→</span>
        </a>
      );
    case "divider":
      return <hr className="border-[rgba(244,241,234,0.12)]" />;
    case "code":
      return (
        <div className="space-y-2">
          <pre className="overflow-x-auto rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.05)] p-4 font-mono text-[13px] leading-relaxed text-[#f4f1ea]">
            <code>{block.text ?? ""}</code>
          </pre>
          {block.caption ? (
            <p className="text-xs text-[#a8a49b]">{block.caption}</p>
          ) : null}
        </div>
      );
    default:
      return null;
  }
}
