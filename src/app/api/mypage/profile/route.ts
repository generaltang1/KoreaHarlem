import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { detectAuthProvider } from "@/lib/auth/provider";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, phone, default_shipping, notify_order, marketing_consent")
    .eq("id", user.id)
    .maybeSingle();

  const provider = detectAuthProvider(user);
  const metaNickname =
    (user.user_metadata?.nickname as string) ||
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    "";

  return NextResponse.json({
    email: user.email ?? "",
    provider,
    nickname: profile?.nickname?.trim() || metaNickname,
    phone: profile?.phone ?? "",
    defaultShipping: profile?.default_shipping ?? null,
    notifyOrder: profile?.notify_order ?? true,
    marketingConsent: profile?.marketing_consent ?? false,
  });
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = (await request.json()) as {
      nickname?: string;
      phone?: string;
      defaultShipping?: {
        postcode?: string;
        address?: string;
        addressDetail?: string;
        phone?: string;
      } | null;
      notifyOrder?: boolean;
      marketingConsent?: boolean;
      currentPassword?: string;
      newPassword?: string;
      withdraw?: boolean;
    };

    if (body.withdraw) {
      const admin = createServiceClient();
      if (!admin) {
        return NextResponse.json(
          { message: "탈퇴 처리에 서비스 키가 필요합니다. 고객센터로 문의해 주세요." },
          { status: 503 },
        );
      }

      const { data: openOrders } = await admin
        .from("orders")
        .select("id, status")
        .eq("user_id", user.id)
        .in("status", ["pending", "paid", "preparing", "ready", "shipped"]);

      if ((openOrders ?? []).length > 0) {
        return NextResponse.json(
          { message: "진행 중인 주문이 있어 탈퇴할 수 없습니다. 주문을 완료·취소한 뒤 다시 시도해 주세요." },
          { status: 400 },
        );
      }

      // 소프트 마킹 + auth 삭제 시도
      await admin
        .from("profiles")
        .update({
          nickname: null,
          phone: null,
          is_blocked: true,
          blocked_at: new Date().toISOString(),
          blocked_reason: "회원 탈퇴",
        })
        .eq("id", user.id);

      const { error: delError } = await admin.auth.admin.deleteUser(user.id);
      if (delError) {
        return NextResponse.json(
          { message: `탈퇴 처리 중 오류: ${delError.message}` },
          { status: 500 },
        );
      }
      return NextResponse.json({ ok: true, withdrawn: true });
    }

    const provider = detectAuthProvider(user);
    if (body.newPassword) {
      if (provider !== "email") {
        return NextResponse.json(
          { message: "소셜 로그인 계정은 해당 서비스에서 비밀번호를 관리합니다." },
          { status: 400 },
        );
      }
      if (!body.currentPassword?.trim()) {
        return NextResponse.json({ message: "현재 비밀번호를 입력해 주세요." }, { status: 400 });
      }
      if (body.newPassword.length < 8 || !/[A-Za-z]/.test(body.newPassword) || !/\d/.test(body.newPassword)) {
        return NextResponse.json(
          { message: "새 비밀번호는 영문·숫자를 포함한 8자 이상이어야 합니다." },
          { status: 400 },
        );
      }

      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email ?? "",
        password: body.currentPassword,
      });
      if (reauthError) {
        return NextResponse.json({ message: "현재 비밀번호가 올바르지 않습니다." }, { status: 400 });
      }

      const { error: pwError } = await supabase.auth.updateUser({ password: body.newPassword });
      if (pwError) {
        return NextResponse.json({ message: pwError.message }, { status: 400 });
      }
    }

    const nickname = body.nickname?.trim() ?? undefined;
    const phone = body.phone?.trim() ?? undefined;
    const patch: Record<string, unknown> = {};
    if (nickname !== undefined) patch.nickname = nickname;
    if (phone !== undefined) patch.phone = phone;
    if (body.defaultShipping !== undefined) {
      patch.default_shipping = body.defaultShipping
        ? {
            postcode: String(body.defaultShipping.postcode ?? ""),
            address: String(body.defaultShipping.address ?? ""),
            addressDetail: String(body.defaultShipping.addressDetail ?? ""),
            phone: String(body.defaultShipping.phone ?? phone ?? ""),
          }
        : null;
    }
    if (typeof body.notifyOrder === "boolean") patch.notify_order = body.notifyOrder;
    if (typeof body.marketingConsent === "boolean") {
      patch.marketing_consent = body.marketingConsent;
      patch.marketing_consent_at = body.marketingConsent ? new Date().toISOString() : null;
    }

    if (Object.keys(patch).length > 0) {
      const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
      if (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
      }
    }

    if (nickname) {
      await supabase.auth.updateUser({
        data: { nickname, full_name: nickname },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "서버 오류" },
      { status: 500 },
    );
  }
}
