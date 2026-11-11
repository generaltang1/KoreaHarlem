import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}****@${domain}`;
}

function detectProvider(user: {
  app_metadata?: { provider?: string; providers?: string[] };
  identities?: { provider?: string }[];
}): "email" | "kakao" | "google" | "unknown" {
  const identities = user.identities ?? [];
  const providers = [
    ...(user.app_metadata?.providers ?? []),
    user.app_metadata?.provider,
    ...identities.map((i) => i.provider),
  ]
    .filter(Boolean)
    .map((p) => String(p).toLowerCase());

  if (providers.some((p) => p.includes("kakao"))) return "kakao";
  if (providers.some((p) => p.includes("google"))) return "google";
  if (providers.some((p) => p === "email" || p === "password")) return "email";
  return "email";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "이메일을 확인해 주세요." }, { status: 400 });
    }

    const admin = createServiceClient();
    if (!admin) {
      return NextResponse.json(
        { error: "계정 조회 설정을 확인해 주세요." },
        { status: 503 },
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const res = await fetch(
      `${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${key}`,
          apikey: key,
        },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      return NextResponse.json({ error: "조회에 실패했습니다." }, { status: 500 });
    }

    const payload = (await res.json()) as {
      users?: Array<{
        email?: string;
        created_at?: string;
        app_metadata?: { provider?: string; providers?: string[] };
        identities?: { provider?: string }[];
      }>;
      user?: {
        email?: string;
        created_at?: string;
        app_metadata?: { provider?: string; providers?: string[] };
        identities?: { provider?: string }[];
      };
    };

    const user =
      payload.user ??
      payload.users?.find((u) => u.email?.toLowerCase() === email) ??
      payload.users?.[0];

    if (!user) {
      return NextResponse.json({
        found: false,
        message: "해당 이메일로 가입된 계정을 찾지 못했어요.",
      });
    }

    const provider = detectProvider(user);
    const createdAt = user.created_at
      ? new Date(user.created_at).toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : null;

    return NextResponse.json({
      found: true,
      maskedEmail: maskEmail(email),
      provider,
      createdAt,
    });
  } catch {
    return NextResponse.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
