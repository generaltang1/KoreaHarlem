import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { incrementTrackDownload } from "@/lib/musicStats";

function safeFilename(name: string, ext: string) {
  const base = name
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return `${base || "track"}.${ext}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trackId = searchParams.get("trackId");
  const rawFormat = searchParams.get("format");
  const format =
    rawFormat === "wav" ? "wav" : rawFormat === "file" ? "file" : "mp3";

  if (!trackId) {
    return NextResponse.json({ message: "trackId가 필요합니다." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const admin = createServiceClient() ?? supabase;
  const { data: track } = await admin
    .from("album_tracks")
    .select("id, album_id, title, audio_url, download_mp3_url, download_wav_url")
    .eq("id", trackId)
    .maybeSingle();

  if (!track) {
    return NextResponse.json({ message: "트랙을 찾을 수 없습니다." }, { status: 404 });
  }

  const { data: entitlements } = await admin
    .from("music_entitlements")
    .select("kind, album_id, track_id")
    .eq("user_id", user.id);

  const owned = (entitlements ?? []).some(
    (row) =>
      (row.kind === "track" && row.track_id === track.id) ||
      (row.kind === "album" && row.album_id === track.album_id),
  );

  if (!owned) {
    return NextResponse.json({ message: "구매한 음원만 다운로드할 수 있습니다." }, { status: 403 });
  }

  const url =
    format === "wav"
      ? track.download_wav_url
      : track.download_mp3_url || track.audio_url;

  if (!url) {
    return NextResponse.json(
      {
        message:
          format === "wav" ? "WAV 파일이 등록되지 않았습니다." : "다운로드 파일이 없습니다.",
      },
      { status: 404 },
    );
  }

  const fileRes = await fetch(url);
  if (!fileRes.ok || !fileRes.body) {
    return NextResponse.json({ message: "파일을 가져오지 못했습니다." }, { status: 502 });
  }

  void incrementTrackDownload(track.id);

  const guessedExt = url.includes(".wav")
    ? "wav"
    : url.includes(".flac")
      ? "flac"
      : "mp3";
  const ext = format === "wav" ? "wav" : format === "file" ? guessedExt : "mp3";
  const filename = safeFilename(track.title, ext);
  const contentType =
    fileRes.headers.get("content-type") ||
    (ext === "wav" ? "audio/wav" : ext === "flac" ? "audio/flac" : "audio/mpeg");

  return new NextResponse(fileRes.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
