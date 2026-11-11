import { NextResponse } from "next/server";
import { incrementTrackDownload } from "@/lib/musicStats";

/** Stub / explicit download counter endpoint. Digital download route also increments. */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "track id가 필요합니다." }, { status: 400 });
  }

  const ok = await incrementTrackDownload(id);
  if (!ok) {
    return NextResponse.json({ message: "트랙을 찾을 수 없거나 집계에 실패했습니다." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
