"use client";

import { useEffect, useState } from "react";
import type { ThinkComment } from "@/lib/think";
import { formatThinkDate, THINK_MAX_GUEST_NICKNAME } from "@/lib/think";

type ThinkCommentsProps = {
  postId: string;
  isLoggedIn: boolean;
  onCountChange?: (count: number) => void;
};

export function ThinkComments({ postId, isLoggedIn, onCountChange }: ThinkCommentsProps) {
  const [comments, setComments] = useState<ThinkComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [guestNickname, setGuestNickname] = useState("ㅇㅇ");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/think/posts/${postId}/comments`);
        const json = (await res.json()) as { comments?: ThinkComment[]; message?: string };
        if (!cancelled) {
          setComments(json.comments ?? []);
          onCountChange?.(json.comments?.length ?? 0);
        }
      } catch {
        if (!cancelled) setComments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId, onCountChange]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/think/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          guestNickname: isLoggedIn ? undefined : guestNickname,
        }),
      });
      const json = (await res.json()) as { comment?: ThinkComment; message?: string };
      if (!res.ok || !json.comment) throw new Error(json.message || "댓글 등록 실패");
      setComments((prev) => {
        const next = [...prev, json.comment!];
        onCountChange?.(next.length);
        return next;
      });
      setBody("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "댓글 등록 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-8 border border-border">
      <header className="border-b border-border px-4 py-3 md:px-6">
        <h2 className="text-sm font-medium uppercase tracking-widest">
          댓글 {comments.length > 0 ? comments.length : ""}
        </h2>
      </header>

      <div className="divide-y divide-border">
        {loading ? (
          <p className="px-4 py-6 text-xs text-muted md:px-6">불러오는 중…</p>
        ) : comments.length === 0 ? (
          <p className="px-4 py-6 text-xs text-muted md:px-6">아직 댓글이 없습니다.</p>
        ) : (
          comments.map((c) => (
            <article key={c.id} className="px-4 py-4 md:px-6">
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                <span className="font-medium text-foreground">
                  {c.author_display ?? c.author_nickname}
                </span>
                <span>{formatThinkDate(c.created_at)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{c.body}</p>
            </article>
          ))
        )}
      </div>

      <form onSubmit={(e) => void submit(e)} className="space-y-3 border-t border-border px-4 py-4 md:px-6">
        {!isLoggedIn && (
          <div className="space-y-1">
            <input
              value={guestNickname}
              onChange={(e) => setGuestNickname(e.target.value.slice(0, THINK_MAX_GUEST_NICKNAME))}
              maxLength={THINK_MAX_GUEST_NICKNAME}
              placeholder="닉네임 (기본 ㅇㅇ)"
              className="w-full border border-border px-3 py-2 text-sm outline-none focus:border-foreground"
            />
            <p className="text-[10px] text-muted">
              표시: ㅇㅇ(110.98) 형식 · IP 전체는 서버에만 저장됩니다
            </p>
          </div>
        )}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          required
          placeholder="댓글을 입력하세요"
          className="w-full resize-none border border-border px-3 py-2 text-sm outline-none focus:border-foreground"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !body.trim()}
          className="border border-border px-4 py-2 text-xs hover:bg-neutral-50 disabled:opacity-50"
        >
          {submitting ? "등록 중…" : "댓글 등록"}
        </button>
      </form>
    </section>
  );
}
