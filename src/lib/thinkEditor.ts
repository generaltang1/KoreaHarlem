import { THINK_MAX_IMAGE_BYTES } from "@/lib/think";

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export type InlineImageInsertResult = {
  id: string;
  file: File;
}[];

/** contentEditable 본문에 이미지를 커서 위치(또는 끝)에 삽입합니다. */
export function insertInlineImages(
  editor: HTMLDivElement,
  files: File[],
  pasteMap: Map<string, File>,
  savedRange: Range | null,
  options?: { maxTotal?: number; onError?: (msg: string) => void },
): InlineImageInsertResult {
  const maxTotal = options?.maxTotal ?? 50;
  const onError = options?.onError;
  const inserted: InlineImageInsertResult = [];

  const range = savedRange;
  const sel = window.getSelection();

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      onError?.("이미지 파일만 삽입할 수 있습니다.");
      continue;
    }
    if (file.size > THINK_MAX_IMAGE_BYTES) {
      onError?.(`"${file.name}"은(는) 20MB 이하여야 합니다.`);
      continue;
    }
    if (pasteMap.size + inserted.length >= maxTotal) {
      onError?.(`이미지는 최대 ${maxTotal}개까지입니다.`);
      break;
    }

    const id = newId();
    pasteMap.set(id, file);
    inserted.push({ id, file });

    const url = URL.createObjectURL(file);
    const img = document.createElement("img");
    img.src = url;
    img.alt = "";
    img.setAttribute("data-paste-id", id);
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    img.style.display = "block";
    img.style.margin = "12px 0";

    if (range && editor.contains(range.startContainer)) {
      range.deleteContents();
      range.insertNode(img);
      const br = document.createElement("br");
      range.setStartAfter(img);
      range.insertNode(br);
      range.setStartAfter(br);
      range.collapse(true);
    } else {
      editor.appendChild(img);
      editor.appendChild(document.createElement("br"));
    }
  }

  if (sel && range) {
    sel.removeAllRanges();
    sel.addRange(range);
  }

  editor.focus();
  return inserted;
}

export function saveEditorSelection(editor: HTMLDivElement | null): Range | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !editor) return null;
  if (!editor.contains(sel.anchorNode)) return null;
  return sel.getRangeAt(0).cloneRange();
}

export function editorHasContent(editor: HTMLDivElement | null): boolean {
  if (!editor) return false;
  const text = (editor.innerText ?? "").replace(/\u00a0/g, " ").trim();
  if (text) return true;
  if (editor.querySelector("img[data-paste-id]")) return true;
  return false;
}
