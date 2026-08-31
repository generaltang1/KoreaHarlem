import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";

type DurationUpdate = {
  id: string;
  duration: number;
};

export async function POST(request: Request) {
  let body: { updates?: DurationUpdate[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
  }

  const updates = body.updates?.filter(
    (u) => u.id && typeof u.duration === "number" && u.duration > 0 && isFinite(u.duration),
  );
  if (!updates?.length) {
    return NextResponse.json({ updated: 0 });
  }

  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json({ updated: 0 });
  }

  let updated = 0;
  for (const { id, duration } of updates) {
    const { data } = await admin
      .from("album_tracks")
      .select("id, duration")
      .eq("id", id)
      .maybeSingle();

    if (!data || data.duration) continue;

    const { error } = await admin
      .from("album_tracks")
      .update({ duration: Math.round(duration) })
      .eq("id", id)
      .is("duration", null);

    if (!error) updated += 1;
  }

  return NextResponse.json({ updated });
}
