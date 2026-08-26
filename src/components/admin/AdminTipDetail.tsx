"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { TipReportWithAttachments } from "@/lib/tips";

interface AdminTipDetailProps {
  tipId: string;
}

export function AdminTipDetail({ tipId }: AdminTipDetailProps) {
  const router = useRouter();
  const [tip, setTip] = useState<TipReportWithAttachments | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/admin/tips/${tipId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "불러오기 실패");
        if (!cancelled) setTip(json.tip);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "오류");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tipId]);

  const handleDelete = async () => {
    if (!tip || !confirm(`"${tip.title}" 제보를 삭제할까요?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/tips/${tipId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "삭제 실패");
      router.push("/admin/tips");
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "삭제 실패");
      setDeleting(false);
    }
  };

  if (loading) return <p className="text-sm text-muted">불러오는 중…</p>;
  if (error || !tip) {
    return (
      <div className="border border-border px-6 py-10 text-center">
        <p className="text-sm text-red-600">{error || "제보를 찾을 수 없습니다."}</p>
        <Link href="/admin/tips" className="mt-4 inline-block text-xs underline">
          목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted">제보 상세</p>
          <h1 className="mt-1 text-xl font-medium">{tip.title}</h1>
          <p className="mt-2 text-xs text-muted">
            {new Date(tip.created_at).toLocaleString("ko-KR")}
            {tip.user_id ? " · 회원" : " · 비회원"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/tips"
            className="border border-border px-4 py-2 text-[10px] uppercase tracking-widest"
          >
            목록
          </Link>
          <button
            type="button"
            disabled={deleting}
            onClick={() => void handleDelete()}
            className="border border-rose-200 px-4 py-2 text-[10px] uppercase tracking-widest text-rose-500 disabled:opacity-50"
          >
            {deleting ? "삭제 중…" : "삭제"}
          </button>
        </div>
      </div>

      <section className="border border-border p-5">
        <h2 className="text-[10px] uppercase tracking-widest text-muted">내용</h2>
        <div
          className="prose-tip mt-4 text-sm leading-relaxed [&_img]:my-3 [&_img]:max-h-96 [&_img]:max-w-full [&_img]:object-contain"
          dangerouslySetInnerHTML={{ __html: tip.content_html }}
        />
      </section>

      {tip.attachments.length > 0 && (
        <section className="border border-border p-5">
          <h2 className="text-[10px] uppercase tracking-widest text-muted">첨부파일</h2>
          <ul className="mt-4 space-y-4">
            {tip.attachments.map((att) => (
              <li key={att.id} className="border-t border-border pt-4 first:border-0 first:pt-0">
                <p className="text-xs text-muted">
                  {att.file_name || att.kind} · {att.mime_type}
                </p>
                {att.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={att.file_url}
                    alt={att.file_name ?? ""}
                    className="mt-2 max-h-80 max-w-full object-contain"
                  />
                ) : att.kind === "video" ? (
                  <div className="mt-2 space-y-2">
                    <video
                      src={att.file_url}
                      controls
                      playsInline
                      preload="metadata"
                      className="aspect-video w-full max-w-2xl bg-black"
                    />
                    <a
                      href={att.file_url}
                      download={att.file_name ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-[10px] uppercase tracking-widest text-muted underline hover:text-foreground"
                    >
                      동영상 다운로드 / 새 탭
                    </a>
                  </div>
                ) : (
                  <a
                    href={att.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs underline"
                  >
                    파일 열기
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
