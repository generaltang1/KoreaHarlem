export type DjSetTrack = {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
};

export type DjSetTrackInput = {
  title: string;
  artist: string;
  audio_url: string;
  cover_url?: string | null;
  sort_order?: number;
  is_published?: boolean;
};

export type DjSetLiveSettings = {
  live_platform: string;
  live_url: string | null;
  live_enabled: boolean;
};

/** YouTube watch/live/short/embed URL → video id */
export function extractYoutubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      const embedIdx = parts.findIndex((p) => p === "embed" || p === "live" || p === "shorts" || p === "v");
      if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];
    }
  } catch {
    /* ignore */
  }
  const m = trimmed.match(/(?:v=|\/embed\/|\/live\/|\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return m?.[1] ?? null;
}

export function youtubeEmbedSrc(videoId: string, autoplay = false): string {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    playsinline: "1",
    enablejsapi: "1",
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}
