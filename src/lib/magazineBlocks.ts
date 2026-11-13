export type MagazineBlockType =
  | "paragraph"
  | "heading"
  | "quote"
  | "image"
  | "youtube"
  | "link"
  | "divider"
  | "code";

export type MagazineBlock = {
  id: string;
  type: MagazineBlockType;
  text?: string;
  caption?: string;
  url?: string;
  credit?: string;
  label?: string;
};

export type MagazineRelatedLink = {
  label: string;
  url: string;
};

export function newBlockId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `b_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyBlock(type: MagazineBlockType): MagazineBlock {
  const id = newBlockId();
  switch (type) {
    case "paragraph":
      return { id, type, text: "" };
    case "heading":
      return { id, type, text: "" };
    case "quote":
      return { id, type, text: "", credit: "" };
    case "image":
      return { id, type, url: "", caption: "", credit: "" };
    case "youtube":
      return { id, type, url: "" };
    case "link":
      return { id, type, url: "", label: "" };
    case "divider":
      return { id, type };
    case "code":
      return { id, type, text: "", caption: "" };
    default:
      return { id, type: "paragraph", text: "" };
  }
}

export function parseBlocks(raw: unknown, fallbackHtml = ""): MagazineBlock[] {
  if (Array.isArray(raw) && raw.length > 0) {
    const out: MagazineBlock[] = [];
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const type = String(o.type ?? "") as MagazineBlockType;
      if (
        ![
          "paragraph",
          "heading",
          "quote",
          "image",
          "youtube",
          "link",
          "divider",
          "code",
        ].includes(type)
      ) {
        continue;
      }
      out.push({
        id: typeof o.id === "string" && o.id ? o.id : newBlockId(),
        type,
        text: typeof o.text === "string" ? o.text : "",
        caption: typeof o.caption === "string" ? o.caption : "",
        url: typeof o.url === "string" ? o.url : "",
        credit: typeof o.credit === "string" ? o.credit : "",
        label: typeof o.label === "string" ? o.label : "",
      });
    }
    if (out.length) return out;
  }

  const html = (fallbackHtml ?? "").trim();
  if (!html) return [createEmptyBlock("paragraph")];
  const text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
  return [{ id: newBlockId(), type: "paragraph", text }];
}

export function blocksToPlainExcerpt(blocks: MagazineBlock[], max = 120): string {
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.type === "paragraph" || b.type === "heading") {
      const t = (b.text ?? "").trim();
      if (t) parts.push(t);
    }
    if (parts.join(" ").length >= max) break;
  }
  const joined = parts.join(" ").replace(/\s+/g, " ").trim();
  if (joined.length <= max) return joined;
  return `${joined.slice(0, max - 1)}…`;
}

export function blocksToHtml(blocks: MagazineBlock[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "paragraph":
          return `<p>${escapeHtml(b.text ?? "").replace(/\n/g, "<br/>")}</p>`;
        case "heading":
          return `<h2>${escapeHtml(b.text ?? "")}</h2>`;
        case "quote":
          return `<blockquote><p>${escapeHtml(b.text ?? "")}</p>${
            b.credit ? `<cite>${escapeHtml(b.credit)}</cite>` : ""
          }</blockquote>`;
        case "image":
          return b.url
            ? `<figure><img src="${escapeAttr(b.url)}" alt="${escapeAttr(
                b.caption ?? "",
              )}"/><figcaption>${escapeHtml(
                [b.caption, b.credit].filter(Boolean).join(" · "),
              )}</figcaption></figure>`
            : "";
        case "youtube": {
          const id = extractYoutubeId(b.url ?? "");
          return id
            ? `<div data-youtube="${escapeAttr(id)}"></div>`
            : "";
        }
        case "link":
          return b.url
            ? `<p><a href="${escapeAttr(b.url)}">${escapeHtml(
                b.label || b.url,
              )}</a></p>`
            : "";
        case "divider":
          return "<hr/>";
        case "code":
          return `<pre><code>${escapeHtml(b.text ?? "")}</code></pre>${
            b.caption ? `<p class="code-caption">${escapeHtml(b.caption)}</p>` : ""
          }`;
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("\n");
}

export function extractYoutubeId(input: string): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  try {
    if (/^[\w-]{11}$/.test(raw)) return raw;
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const v = url.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const parts = url.pathname.split("/").filter(Boolean);
      const embedIdx = parts.indexOf("embed");
      if (embedIdx >= 0 && parts[embedIdx + 1] && /^[\w-]{11}$/.test(parts[embedIdx + 1])) {
        return parts[embedIdx + 1];
      }
      const shortsIdx = parts.indexOf("shorts");
      if (shortsIdx >= 0 && parts[shortsIdx + 1] && /^[\w-]{11}$/.test(parts[shortsIdx + 1])) {
        return parts[shortsIdx + 1];
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function slugifyTitle(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return base || `post-${Date.now().toString(36)}`;
}

export function normalizeHashtags(tags: string[]): string[] {
  const out: string[] = [];
  for (const t of tags) {
    const cleaned = t.replace(/^#/, "").trim();
    if (!cleaned) continue;
    if (out.some((x) => x.toLowerCase() === cleaned.toLowerCase())) continue;
    out.push(cleaned);
    if (out.length >= 5) break;
  }
  return out;
}

export function parseRelatedLinks(raw: unknown): MagazineRelatedLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const url = typeof o.url === "string" ? o.url.trim() : "";
      const label = typeof o.label === "string" ? o.label.trim() : "";
      if (!url) return null;
      return { url, label: label || url };
    })
    .filter((x): x is MagazineRelatedLink => Boolean(x));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
