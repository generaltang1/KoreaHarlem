"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ReviewItem {
  id: string;
  author_nickname: string;
  rating: number;
  body: string;
  created_at: string;
}

interface QnaItem {
  id: string;
  author_nickname: string;
  question: string;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
}

interface ProductReviewsAndQnaProps {
  productId: string;
  isLoggedIn: boolean;
  isAdmin?: boolean;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="tracking-tight text-amber-600" aria-label={`${rating}점`}>
      {"★".repeat(rating)}
      <span className="text-neutral-300">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export function ProductReviewsAndQna({
  productId,
  isLoggedIn,
  isAdmin = false,
}: ProductReviewsAndQnaProps) {
  const [tab, setTab] = useState<"reviews" | "qna">("reviews");
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [qna, setQna] = useState<QnaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [question, setQuestion] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [reviewsRes, qnaRes] = await Promise.all([
        fetch(`/api/products/${productId}/reviews`),
        fetch(`/api/products/${productId}/qna`),
      ]);
      const reviewsJson = await reviewsRes.json();
      const qnaJson = await qnaRes.json();
      if (!reviewsRes.ok) throw new Error(reviewsJson.message || "후기 로드 실패");
      if (!qnaRes.ok) throw new Error(qnaJson.message || "Q&A 로드 실패");
      setReviews(reviewsJson.reviews ?? []);
      setQna(qnaJson.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, body: reviewBody }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "후기 등록 실패");
      setReviews((prev) => [json.review, ...prev]);
      setReviewBody("");
      setRating(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "후기 등록 실패");
    } finally {
      setSubmitting(false);
    }
  };

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${productId}/qna`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "질문 등록 실패");
      setQna((prev) => [json.item, ...prev]);
      setQuestion("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "질문 등록 실패");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!isAdmin || !confirm("이 후기를 삭제할까요?")) return;
    setError("");
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "삭제 실패");
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    }
  };

  return (
    <section className="mt-16 border-t border-border pt-10">
      <div className="flex gap-6 border-b border-border">
        <button
          type="button"
          onClick={() => setTab("reviews")}
          className={`pb-3 text-xs uppercase tracking-widest ${
            tab === "reviews" ? "border-b-2 border-foreground text-foreground" : "text-muted"
          }`}
        >
          Reviews ({reviews.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("qna")}
          className={`pb-3 text-xs uppercase tracking-widest ${
            tab === "qna" ? "border-b-2 border-foreground text-foreground" : "text-muted"
          }`}
        >
          Q&amp;A ({qna.length})
        </button>
      </div>

      {error && <p className="mt-4 text-xs text-rose-500">{error}</p>}
      {loading && <p className="mt-6 text-sm text-muted">불러오는 중...</p>}

      {!loading && tab === "reviews" && (
        <div className="mt-6 space-y-8">
          {isLoggedIn ? (
            <form onSubmit={submitReview} className="space-y-3 border border-border p-4">
              <p className="text-[10px] uppercase tracking-widest text-muted">후기 작성</p>
              <label className="block text-xs">
                별점
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="mt-1 w-full border border-border px-3 py-2 text-sm sm:w-40"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n}점
                    </option>
                  ))}
                </select>
              </label>
              <textarea
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value.slice(0, 2000))}
                rows={3}
                required
                placeholder="상품에 대한 후기를 남겨주세요."
                className="w-full resize-none border border-border px-3 py-2 text-sm outline-none focus:border-foreground"
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-foreground px-4 py-2 text-[10px] uppercase tracking-widest text-background disabled:opacity-50"
              >
                {submitting ? "등록 중..." : "후기 등록"}
              </button>
            </form>
          ) : (
            <p className="text-sm text-muted">
              후기 작성은{" "}
              <Link href={`/login?next=/sale/${productId}`} className="underline">
                로그인
              </Link>
              이 필요합니다.
            </p>
          )}

          {reviews.length === 0 ? (
            <p className="text-sm text-muted">아직 등록된 후기가 없습니다.</p>
          ) : (
            <ul className="space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="border-b border-border pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Stars rating={r.rating} />
                      <span className="font-medium">{r.author_nickname || "회원"}</span>
                      <span className="text-muted">
                        {new Date(r.created_at).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => deleteReview(r.id)}
                        className="text-[10px] uppercase tracking-widest text-rose-500 hover:underline"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{r.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!loading && tab === "qna" && (
        <div className="mt-6 space-y-8">
          {isLoggedIn ? (
            <form onSubmit={submitQuestion} className="space-y-3 border border-border p-4">
              <p className="text-[10px] uppercase tracking-widest text-muted">질문하기</p>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value.slice(0, 1000))}
                rows={3}
                required
                placeholder="상품에 대해 궁금한 점을 남겨주세요."
                className="w-full resize-none border border-border px-3 py-2 text-sm outline-none focus:border-foreground"
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-foreground px-4 py-2 text-[10px] uppercase tracking-widest text-background disabled:opacity-50"
              >
                {submitting ? "등록 중..." : "질문 등록"}
              </button>
            </form>
          ) : (
            <p className="text-sm text-muted">
              질문은{" "}
              <Link href={`/login?next=/sale/${productId}`} className="underline">
                로그인
              </Link>
              후 등록할 수 있습니다.
            </p>
          )}

          {qna.length === 0 ? (
            <p className="text-sm text-muted">아직 등록된 질문이 없습니다.</p>
          ) : (
            <ul className="space-y-4">
              {qna.map((item) => (
                <li key={item.id} className="border-b border-border pb-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-medium">Q. {item.author_nickname || "회원"}</span>
                    <span className="text-muted">
                      {new Date(item.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{item.question}</p>
                  {item.answer && (
                    <div className="mt-3 border-l-2 border-border pl-3">
                      <p className="text-[10px] uppercase tracking-widest text-muted">Answer</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{item.answer}</p>
                      {item.answered_at && (
                        <p className="mt-1 text-[10px] text-muted">
                          {new Date(item.answered_at).toLocaleDateString("ko-KR")}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
