import { NextResponse } from "next/server";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

function safePart(name: string) {
  return name
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60) || "track";
}

/** 구매한 디지털 앨범 수록곡을 ZIP으로 묶음 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const albumId = searchParams.get("albumId");
  const wantWav = searchParams.get("format") === "wav";
  if (!albumId) {
    return NextResponse.json({ message: "albumId가 필요합니다." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const admin = createServiceClient() ?? supabase;
  const { data: entitlement } = await admin
    .from("music_entitlements")
    .select("id")
    .eq("user_id", user.id)
    .eq("kind", "album")
    .eq("album_id", albumId)
    .maybeSingle();

  if (!entitlement) {
    return NextResponse.json({ message: "구매한 앨범만 ZIP 다운로드할 수 있습니다." }, { status: 403 });
  }

  const { data: album } = await admin
    .from("albums")
    .select(
      "id, title, album_tracks(id, title, track_order, audio_url, download_mp3_url, download_wav_url)",
    )
    .eq("id", albumId)
    .maybeSingle();

  if (!album) {
    return NextResponse.json({ message: "앨범을 찾을 수 없습니다." }, { status: 404 });
  }

  const tracks = [...(album.album_tracks ?? [])].sort(
    (a: { track_order: number }, b: { track_order: number }) => a.track_order - b.track_order,
  );

  const zip = new JSZip();
  let added = 0;
  for (const track of tracks) {
    const url = wantWav ? track.download_wav_url : track.download_mp3_url || track.audio_url;
    if (!url) continue;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const buf = await res.arrayBuffer();
      const ext = wantWav || url.includes(".wav") ? "wav" : "mp3";
      const name = `${String(track.track_order).padStart(2, "0")} ${safePart(track.title)}.${ext}`;
      zip.file(name, buf);
      added += 1;
    } catch {
      // skip failed file
    }
  }

  if (added === 0) {
    return NextResponse.json({ message: "다운로드할 수록곡 파일이 없습니다." }, { status: 404 });
  }

  const out = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  const filename = `${safePart(album.title)}${wantWav ? " (WAV)" : ""}.zip`;
  return new NextResponse(Buffer.from(out), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
