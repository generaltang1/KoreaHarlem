"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { DaumPostcodeButton } from "@/components/commerce/DaumPostcodeButton";
import { authProviderLabel, type AuthProviderKind } from "@/lib/auth/provider";
import { mp } from "@/lib/mypageTheme";

export type ProfileFormInitial = {
  email: string;
  provider: AuthProviderKind;
  nickname: string;
  phone: string;
  defaultShipping: {
    postcode: string;
    address: string;
    addressDetail: string;
    phone: string;
  } | null;
  notifyOrder: boolean;
  marketingConsent: boolean;
};

export function ProfileForm({ initial }: { initial: ProfileFormInitial }) {
  const router = useRouter();
  const [nickname, setNickname] = useState(initial.nickname);
  const [phone, setPhone] = useState(initial.phone);
  const [postcode, setPostcode] = useState(initial.defaultShipping?.postcode ?? "");
  const [address, setAddress] = useState(initial.defaultShipping?.address ?? "");
  const [addressDetail, setAddressDetail] = useState(
    initial.defaultShipping?.addressDetail ?? "",
  );
  const [notifyOrder, setNotifyOrder] = useState(initial.notifyOrder);
  const [marketingConsent, setMarketingConsent] = useState(initial.marketingConsent);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const isEmail = initial.provider === "email";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword || confirmPassword || currentPassword) {
      if (!isEmail) {
        setError("소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("새 비밀번호 확인이 일치하지 않습니다.");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/mypage/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          phone,
          defaultShipping: {
            postcode,
            address,
            addressDetail,
            phone,
          },
          notifyOrder,
          marketingConsent,
          ...(isEmail && newPassword
            ? { currentPassword, newPassword }
            : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "저장 실패");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("저장되었습니다.");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!confirm("정말 탈퇴하시겠습니까? 진행 중 주문이 있으면 탈퇴할 수 없습니다.")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/mypage/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdraw: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "탈퇴 실패");
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "탈퇴 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section className={`${mp.card} p-5 sm:p-6`}>
        <h2 className="text-sm font-semibold">계정</h2>
        <div className="mt-4 space-y-4">
          <div>
            <span className={mp.label}>로그인 수단</span>
            <span className="inline-flex items-center bg-[#FEE500] px-2.5 py-1 text-xs font-semibold text-[#191919]">
              {authProviderLabel(initial.provider)}
            </span>
          </div>
          <div>
            <label className={mp.label}>이메일</label>
            <input className={mp.input} value={initial.email} disabled readOnly />
            <p className={`mt-1.5 text-xs ${mp.muted}`}>
              {isEmail
                ? "가입 시 사용한 이메일입니다. 변경할 수 없습니다."
                : "소셜 로그인 계정은 이메일을 변경할 수 없습니다."}
            </p>
          </div>
          <div>
            <label className={mp.label}>닉네임</label>
            <input
              className={mp.input}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="THINK 글·댓글에 보이는 이름"
              maxLength={40}
            />
          </div>
          <div>
            <label className={mp.label}>연락처</label>
            <input
              className={mp.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
            />
          </div>
        </div>
      </section>

      <section className={`${mp.card} p-5 sm:p-6`}>
        <h2 className="text-sm font-semibold">비밀번호 변경</h2>
        {!isEmail ? (
          <p className={`mt-3 text-xs ${mp.muted}`}>
            카카오·Google 로그인 회원은 해당 서비스에서 비밀번호를 관리합니다.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            <div>
              <label className={mp.label}>현재 비밀번호</label>
              <input
                type="password"
                className={mp.input}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className={mp.label}>새 비밀번호</label>
              <input
                type="password"
                className={mp.input}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className={mp.label}>새 비밀번호 확인</label>
              <input
                type="password"
                className={mp.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <p className={`mt-1.5 text-xs ${mp.muted}`}>영문·숫자 포함 8자 이상</p>
            </div>
          </div>
        )}
      </section>

      <section className={`${mp.card} p-5 sm:p-6`}>
        <h2 className="text-sm font-semibold">기본 배송지</h2>
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <input className={mp.input} value={postcode} readOnly placeholder="우편번호" />
            <DaumPostcodeButton
              className="shrink-0 border border-[#333] bg-[#1c1c1c] px-4 text-xs text-white"
              onComplete={(data) => {
                setPostcode(data.postcode);
                setAddress(data.address);
              }}
            />
          </div>
          <input className={mp.input} value={address} readOnly placeholder="주소" />
          <input
            className={mp.input}
            value={addressDetail}
            onChange={(e) => setAddressDetail(e.target.value)}
            placeholder="상세 주소"
          />
        </div>
      </section>

      <section className={`${mp.card} p-5 sm:p-6`}>
        <h2 className="text-sm font-semibold">알림</h2>
        <div className="mt-4 space-y-4">
          <ToggleRow
            label="주문·배송 알림"
            checked={notifyOrder}
            onChange={setNotifyOrder}
          />
          <ToggleRow
            label="마케팅 수신 동의 (신보·티켓 소식)"
            checked={marketingConsent}
            onChange={setMarketingConsent}
          />
        </div>
      </section>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-400">{message}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={loading} className={mp.creamBtn}>
          {loading ? "저장 중..." : "저장하기"}
        </button>
        <Link href="/mypage" className={mp.ghostBtn}>
          취소
        </Link>
      </div>

      <section className={`${mp.card} p-5 sm:p-6`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-rose-300">회원 탈퇴</h2>
            <p className={`mt-1 text-xs ${mp.muted}`}>
              진행 중 주문이 있으면 탈퇴할 수 없습니다. 구매한 음원 다운로드 권한은 삭제됩니다.
              보관 기간 등 상세 정책은 약관을 확인해 주세요.
            </p>
          </div>
          {!withdrawOpen ? (
            <button
              type="button"
              onClick={() => setWithdrawOpen(true)}
              className="border border-rose-500/60 px-4 py-2 text-xs text-rose-300"
            >
              회원 탈퇴
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleWithdraw}
              className="bg-rose-600 px-4 py-2 text-xs text-white disabled:opacity-50"
            >
              탈퇴 확인
            </button>
          )}
        </div>
      </section>
    </form>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition-colors ${
          checked ? "bg-[#FEE500]" : "bg-[#333]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
            checked ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
