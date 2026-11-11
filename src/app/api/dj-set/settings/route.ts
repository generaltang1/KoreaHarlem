import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("dj_set_settings")
      .select("live_platform, live_url, live_enabled")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          settings: { live_platform: "youtube", live_url: null, live_enabled: false },
          message: error.message,
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      settings: data ?? {
        live_platform: "youtube",
        live_url: null,
        live_enabled: false,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        settings: { live_platform: "youtube", live_url: null, live_enabled: false },
        message: err instanceof Error ? err.message : "서버 오류",
      },
      { status: 200 },
    );
  }
}
