"use client";

import { useEffect, useMemo, useState } from "react";
import type { ThinkComment } from "@/lib/think";
import { formatThinkDate, THINK_MAX_GUEST_NICKNAME } from "@/lib/think";
import { mp } from "@/lib/mypageTheme";

type ThinkCommentsProps = {
  postId: string;
  isLoggedIn: boolean;
  onCountChange?: (count: number) => void;
};

type Thread = {
  root: ThinkComment;
  replies: ThinkComment[];
};

export function ThinkComments({ postId, isLoggedIn, onCountChange }: ThinkCommentsProps) {
  const [comments, setComments] = useState<ThinkComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [guestNickname, setGuestNickname] = useState("ㅇㅇ");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [replyTo, setReplyTo] = useState<ThinkComment | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyError, setReplyError] = useState("");

  const threads = useMemo(() => {
    const idSet = new Set(comments.map((c) => c.id));
    const roots = comments.filter((c) => !c.parent_id || !idSet.has(c.parent_id));
    const byParent = new Map<string, ThinkComment[]>();
    for (const c of comments) {
      if (!c.parent_id || !idSet.has(c.parent_id)) continue;
      const list = byParent.get(c.parent_id) ?? [];
      list.push(c);
      byParent.set(c.parent_id, list);
    }
    return roots.map(
      (root): Thread => ({
        root,
        replies: byParent.get(root.id) ?? [],
      }),
    );
  }, [comments]);

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

  const appendComment = (comment: ThinkComment) => {
    setComments((prev) => {
      const next = [...prev, comment];
      onCountChange?.(next.length);
      return next;
    });
  };

  const submitRoot = async (e: React.FormEvent) => {
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
      appendComment(json.comment);
      setBody("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "댓글 등록 실패");
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTo) return;
    setReplySubmitting(true);
    setReplyError("");
    try {
      const res = await fetch(`/api/think/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: replyBody,
          parentId: replyTo.id,
          guestNickname: isLoggedIn ? undefined : guestNickname,
        }),
      });
      const json = (await res.json()) as { comment?: ThinkComment; message?: string };
      if (!res.ok || !json.comment) throw new Error(json.message || "답글 등록 실패");
      appendComment(json.comment);
      setReplyBody("");
      setReplyTo(null);
    } catch (err: unknown) {
      setReplyError(err instanceof Error ? err.message : "답글 등록 실패");
    } finally {
      setReplySubmitting(false);
    }
  };

  return (
    <section className={`${mp.card} mt-8`}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(244,241,234,0.12)] px-5 py-4 md:px-7">
        <h2 className="text-sm font-medium tracking-wide text-[#f4f1ea]">
          댓글
          {comments.length > 0 ? (
            <span className={`ml-2 tabular-nums ${mp.yellow}`}>{comments.length}</span>
          ) : null}
        </h2>
        <p className={`text-[10px] ${mp.tertiary}`}>답글은 1단계까지</p>
      </header>

      <div className="divide-y divide-[rgba(244,241,234,0.08)]">
        {loading ? (
          <p className={`px-5 py-7 text-xs ${mp.muted} md:px-7`}>불러오는 중…</p>
        ) : threads.length === 0 ? (
          <p className={`px-5 py-7 text-xs ${mp.muted} md:px-7`}>아직 댓글이 없습니다.</p>
        ) : (
          threads.map(({ root, replies }) => (
            <div key={root.id} className="px-5 py-5 md:px-7">
              <CommentBlock
                comment={root}
                onReply={() => {
                  setReplyTo(root);
                  setReplyBody("");
                  setReplyError("");
                }}
              />

              {replies.length > 0 ? (
                <div className="ml-2 mt-4 space-y-4 border-l-2 border-[rgba(251,194,1,0.4)] pl-4">
                  {replies.map((r) => (
                    <CommentBlock
                      key={r.id}
                      comment={r}
                      isReply
                      replyToName={root.author_display ?? root.author_nickname}
                    />
                  ))}
                </div>
              ) : null}

              {replyTo?.id === root.id ? (
                <form
                  onSubmit={(e) => void submitReply(e)}
                  className="mt-4 space-y-2 rounded-[8px] border border-[rgba(244,241,234,0.12)] bg-[rgba(244,241,234,0.04)] p-3.5"
                >
                  <p className={`text-[11px] ${mp.muted}`}>
                    <span className={mp.yellow}>@{root.author_display ?? root.author_nickname}</span>
                    님에게 답글
                  </p>
                  {!isLoggedIn ? (
                    <input
                      value={guestNickname}
                      onChange={(e) =>
                        setGuestNickname(e.target.value.slice(0, THINK_MAX_GUEST_NICKNAME))
                      }
                      maxLength={THINK_MAX_GUEST_NICKNAME}
                      placeholder="닉네임 (기본 ㅇㅇ)"
                      className={`${mp.input} py-2 text-xs`}
                    />
                  ) : null}
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    rows={2}
                    required
                    autoFocus
                    placeholder="답글을 입력하세요"
                    className={`${mp.input} resize-none text-sm`}
                  />
                  {replyError ? <p className="text-xs text-rose-300">{replyError}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={replySubmitting || !replyBody.trim()}
                      className={`${mp.creamBtn} px-4 py-2 text-xs`}
                    >
                      {replySubmitting ? "등록 중…" : "답글 등록"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo(null);
                        setReplyBody("");
                        setReplyError("");
                      }}
                      className={`${mp.ghostBtn} px-4 py-2 text-xs`}
                    >
                      취소
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={(e) => void submitRoot(e)}
        className="space-y-3 border-t border-[rgba(244,241,234,0.12)] px-5 py-5 md:px-7"
      >
        <p className={`text-[11px] tracking-wide ${mp.tertiary}`}>새 댓글</p>
        {!isLoggedIn && (
          <div className="space-y-1">
            <input
              value={guestNickname}
              onChange={(e) => setGuestNickname(e.target.value.slice(0, THINK_MAX_GUEST_NICKNAME))}
              maxLength={THINK_MAX_GUEST_NICKNAME}
              placeholder="닉네임 (기본 ㅇㅇ)"
              className={mp.input}
            />
            <p className={`text-[10px] ${mp.tertiary}`}>
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
          className={`${mp.input} resize-none`}
        />
        {error ? <p className="text-xs text-rose-300">{error}</p> : null}
        <button type="submit" disabled={submitting || !body.trim()} className={mp.creamBtn}>
          {submitting ? "등록 중…" : "댓글 등록"}
        </button>
      </form>
    </section>
  );
}

function CommentBlock({
  comment,
  isReply = false,
  replyToName,
  onReply,
}: {
  comment: ThinkComment;
  isReply?: boolean;
  replyToName?: string;
  onReply?: () => void;
}) {
  return (
    <article>
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${mp.muted}`}>
        {isReply ? (
          <span className={`rounded-[4px] px-1.5 py-0.5 text-[10px] ${mp.pillActive}`}>답글</span>
        ) : null}
        <span className="font-medium text-[#f4f1ea]">
          {comment.author_display ?? comment.author_nickname}
        </span>
        {isReply && replyToName ? (
          <span className="text-[10px]">
            → <span className={mp.yellow}>@{replyToName}</span>
          </span>
        ) : null}
        <span className="tabular-nums">{formatThinkDate(comment.created_at)}</span>
        {!isReply && onReply ? (
          <button
            type="button"
            onClick={onReply}
            className={`ml-auto rounded-[4px] px-2 py-0.5 text-[11px] ${mp.muted} transition-colors hover:bg-[rgba(251,194,1,0.1)] hover:text-[#FBC201]`}
          >
            답글
          </button>
        ) : null}
      </div>
      <p
        className={`mt-2 whitespace-pre-wrap leading-relaxed text-[#f4f1ea] ${
          isReply ? "text-[13px]" : "text-sm"
        }`}
      >
        {comment.body}
      </p>
    </article>
  );
}
