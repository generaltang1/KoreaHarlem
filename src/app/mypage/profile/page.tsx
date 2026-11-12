import { redirect } from "next/navigation";
import { MypageShell } from "@/components/mypage/MypageShell";
import { ProfileForm } from "@/components/mypage/ProfileForm";
import { createClient } from "@/lib/supabase/server";
import { detectAuthProvider } from "@/lib/auth/provider";
import type { ShippingAddress } from "@/lib/shippingAddress";

export default async function MyProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/mypage/profile");

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

  const shipping = (profile?.default_shipping ?? null) as ShippingAddress | null;

  return (
    <MypageShell title="내 정보 변경" subtitle="계정 · 배송지 · 알림을 관리합니다">
      <ProfileForm
        initial={{
          email: user.email ?? "",
          provider,
          nickname: profile?.nickname?.trim() || metaNickname,
          phone: profile?.phone ?? "",
          defaultShipping: shipping
            ? {
                postcode: shipping.postcode ?? "",
                address: shipping.address ?? "",
                addressDetail: shipping.addressDetail ?? "",
                phone: shipping.phone ?? "",
              }
            : null,
          notifyOrder: profile?.notify_order ?? true,
          marketingConsent: profile?.marketing_consent ?? false,
        }}
      />
    </MypageShell>
  );
}
