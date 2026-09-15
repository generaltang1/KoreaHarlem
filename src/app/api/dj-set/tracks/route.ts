import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("dj_set_tracks")
      .select("id, title, artist, audio_url, cover_url, sort_order, is_published, created_at")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ message: error.message, tracks: [] }, { status: 500 });
    }

    return NextResponse.json({ tracks: data ?? [] });
  } catch (err: unknown) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "서버 오류", tracks: [] },
      { status: 500 },
    );
  }
}
