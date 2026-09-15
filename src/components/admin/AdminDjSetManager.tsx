"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DjSetTrack } from "@/lib/djSet";

export function AdminDjSetManager() {
  const supabase = createClient();
  const [tracks, setTracks] = useState<DjSetTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: fetchError } = await supabase
      .from("dj_set_tracks")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (fetchError) {
      setError(
        fetchError.message.includes("dj_set_tracks")
          ? "dj_set_tracks 테이블이 없습니다. supabase/add_dj_set_tracks.sql을 실행하세요."
          : fetchError.message,
      );
      setTracks([]);
    } else {
      setTracks((data ?? []) as DjSetTrack[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const uploadFile = async (file: File, folder: string) => {
    const ext = file.name.split(".").pop() || "bin";
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("dj-set").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("dj-set").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !audioFile) {
      setError("제목과 음원 파일이 필요합니다.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const audio_url = await uploadFile(audioFile, "audio");
      const cover_url = coverFile ? await uploadFile(coverFile, "covers") : null;
      const nextOrder = tracks.length > 0 ? Math.max(...tracks.map((t) => t.sort_order)) + 1 : 0;
      const { error: insertError } = await supabase.from("dj_set_tracks").insert({
        title: title.trim(),
        artist: artist.trim(),
        audio_url,
        cover_url,
        sort_order: nextOrder,
        is_published: true,
      });
      if (insertError) throw insertError;
      setTitle("");
      setArtist("");
      setAudioFile(null);
      setCoverFile(null);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "등록 실패");
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (track: DjSetTrack) => {
    const { error: updateError } = await supabase
      .from("dj_set_tracks")
      .update({ is_published: !track.is_published, updated_at: new Date().toISOString() })
      .eq("id", track.id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("이 DJ SET 트랙을 삭제할까요?")) return;
    const { error: deleteError } = await supabase.from("dj_set_tracks").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await load();
  };

  const move = async (id: string, direction: -1 | 1) => {
    const idx = tracks.findIndex((t) => t.id === id);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= tracks.length) return;
    const a = tracks[idx];
    const b = tracks[swapIdx];
    await Promise.all([
      supabase.from("dj_set_tracks").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("dj_set_tracks").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    await load();
  };

  return (
    <div className="space-y-8">
      <form onSubmit={(e) => void handleAdd(e)} className="space-y-4 border border-border p-4">
        <h2 className="text-sm font-medium uppercase tracking-wider">새 트랙 등록</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-xs">
            제목 *
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="block text-xs">
            아티스트
            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs">
            음원 파일 *
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full text-sm"
              required
            />
          </label>
          <label className="block text-xs">
            커버 (선택)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full text-sm"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="border border-border px-4 py-2 text-[10px] uppercase tracking-widest hover:border-foreground disabled:opacity-50"
        >
          {saving ? "업로드 중…" : "+ 등록"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted">불러오는 중…</p>
      ) : tracks.length === 0 ? (
        <p className="text-sm text-muted">등록된 DJ SET 트랙이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-border border border-border">
          {tracks.map((track, i) => (
            <li key={track.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
              <span className="w-6 font-mono text-xs text-muted">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{track.title}</p>
                <p className="truncate text-xs text-muted">{track.artist || "—"}</p>
              </div>
              <span
                className={`text-[10px] uppercase tracking-widest ${
                  track.is_published ? "text-emerald-600" : "text-muted"
                }`}
              >
                {track.is_published ? "공개" : "비공개"}
              </span>
              <button
                type="button"
                onClick={() => void move(track.id, -1)}
                className="text-xs text-muted hover:text-foreground"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => void move(track.id, 1)}
                className="text-xs text-muted hover:text-foreground"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => void togglePublished(track)}
                className="text-xs hover:underline"
              >
                {track.is_published ? "숨김" : "공개"}
              </button>
              <button
                type="button"
                onClick={() => void remove(track.id)}
                className="text-xs text-red-600 hover:underline"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
