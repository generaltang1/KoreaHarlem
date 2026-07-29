"use client";

import { useState } from "react";

interface ConsentModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const TERMS_TEXT = `제1조 목적

본 이용약관은 "koreaharlem"(이하 "코리아할렘")의 서비스의 이용조건과 운영에 관한 제반 사항 규정을 목적으로 합니다.

제2조 용어의 정의

① 회원 : 사이트의 약관에 동의하고 개인정보를 제공하여 회원등록을 한 자로서, 사이트와의 이용계약을 체결하고 사이트를 이용하는 이용자를 말합니다.
② 이용계약 : 사이트 이용과 관련하여 사이트와 회원간에 체결하는 계약을 말합니다.
③ 회원 아이디(이하 "ID") : 회원의 식별과 회원의 서비스 이용을 위하여 회원별로 부여하는 고유한 문자와 숫자의 조합을 말합니다.
④ 비밀번호 : 회원이 부여받은 ID와 일치된 회원임을 확인하고 회원의 권익 보호를 위하여 회원이 선정한 문자와 숫자의 조합을 말합니다.
⑤ 운영자 : 서비스에 홈페이지를 개설하여 운영하는 운영자를 말합니다.
⑥ 해지 : 회원이 이용계약을 해약하는 것을 말합니다.

제3조 약관 외 준칙

운영자는 필요한 경우 별도로 운영정책을 공지 안내할 수 있으며, 본 약관과 운영정책이 중첩될 경우 운영정책이 우선 적용됩니다.

제4조 이용계약 체결

① 이용계약은 회원으로 등록하여 사이트를 이용하려는 자의 본 약관 내용에 대한 동의와 가입신청에 대하여 운영자의 이용승낙으로 성립합니다.
② 회원으로 등록하여 서비스를 이용하려는 자는 사이트 가입신청 시 본 약관을 읽고 아래에 있는 "동의합니다"를 선택하는 것으로 본 약관에 대한 동의 의사 표시를 합니다.

제5조 서비스 이용 신청

① 회원으로 등록하여 사이트를 이용하려는 이용자는 사이트에서 요청하는 제반정보(이용자ID, 비밀번호, 닉네임 등)를 제공해야 합니다.
② 타인의 정보를 도용하거나 허위의 정보를 등록하는 등 본인의 진정한 정보를 등록하지 않은 회원은 사이트 이용과 관련하여 아무런 권리를 주장할 수 없으며, 관계 법령에 따라 처벌받을 수 있습니다.

제6조~제16조 (생략 — 전문은 이용약관 페이지에서 확인 가능)

부칙: 이 약관은 2026년 1월 1일부터 시행합니다.`;

const PRIVACY_TEXT = `1. 개인정보 수집목적 및 이용목적

(1) 홈페이지 회원 가입 및 관리
회원 가입 의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정 이용 방지, 만 14세 미만 아동의 개인정보 처리시 법정대리인의 동의 여부 확인, 각종 고지·통지, 고충 처리 등의 목적

(2) 재화 또는 서비스 제공
물품 배송, 서비스 제공, 계약서·청구서 발송, 콘텐츠 제공, 맞춤 서비스 제공, 본인인증, 연령인증, 요금 결제 및 정산, 채권추심 등의 목적

(3) 고충 처리
민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지, 처리 결과 통보 등

2. 수집하는 개인정보 항목
ID, 성명, 비밀번호, 주소, 휴대폰 번호, 이메일, 14세 미만 가입자의 경우 법정대리인 정보

3. 개인정보 보유 및 이용기간
회원탈퇴 시까지 (단, 관계 법령에 보존 근거가 있는 경우 해당 기간까지 보유)`;

export function ConsentModal({ onConfirm, onCancel }: ConsentModalProps) {
  const [allChecked, setAllChecked] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [ageCheck, setAgeCheck] = useState(false);

  const handleAllCheck = (checked: boolean) => {
    setAllChecked(checked);
    setTerms(checked);
    setPrivacy(checked);
    setAgeCheck(checked);
  };

  const handleIndividual = (
    setter: (v: boolean) => void,
    value: boolean,
    others: boolean[]
  ) => {
    setter(value);
    const newAll = value && others.every(Boolean);
    setAllChecked(newAll);
  };

  const canProceed = terms && privacy && ageCheck;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg bg-white">
        {/* 헤더 */}
        <div className="border-b border-border px-6 py-4 text-center">
          <h2 className="text-sm font-medium">약관동의</h2>
        </div>

        <div className="space-y-4 px-6 py-6">
          {/* 전체 동의 */}
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={(e) => handleAllCheck(e.target.checked)}
              className="h-4 w-4 accent-foreground"
            />
            <span className="text-sm">이용약관, 개인정보 수집 및 이용에 모두 동의합니다.</span>
          </label>

          <div className="h-px bg-border" />

          {/* 이용약관 */}
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) =>
                  handleIndividual(setTerms, e.target.checked, [privacy, ageCheck])
                }
                className="h-4 w-4 accent-foreground"
              />
              <span className="text-sm">
                이용약관 동의{" "}
                <span className="text-rose-500">(필수)</span>
              </span>
            </label>
            <textarea
              readOnly
              value={TERMS_TEXT}
              className="h-28 w-full resize-none border border-border bg-neutral-50 px-3 py-2 text-xs leading-relaxed text-muted outline-none"
            />
          </div>

          {/* 개인정보 수집 및 이용 */}
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={privacy}
                onChange={(e) =>
                  handleIndividual(setPrivacy, e.target.checked, [terms, ageCheck])
                }
                className="h-4 w-4 accent-foreground"
              />
              <span className="text-sm">
                개인정보 수집 및 이용 동의{" "}
                <span className="text-rose-500">(필수)</span>
              </span>
            </label>
            <textarea
              readOnly
              value={PRIVACY_TEXT}
              className="h-28 w-full resize-none border border-border bg-neutral-50 px-3 py-2 text-xs leading-relaxed text-muted outline-none"
            />
          </div>

          {/* 만 14세 이상 */}
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={ageCheck}
              onChange={(e) =>
                handleIndividual(setAgeCheck, e.target.checked, [terms, privacy])
              }
              className="h-4 w-4 accent-foreground"
            />
            <span className="text-sm">
              만 14세 이상입니다.{" "}
              <span className="text-rose-500">(필수)</span>
            </span>
          </label>
        </div>

        {/* 버튼 */}
        <div className="grid grid-cols-2 border-t border-border">
          <button
            onClick={onCancel}
            className="py-4 text-sm text-muted transition-colors hover:bg-neutral-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={!canProceed}
            className="bg-foreground py-4 text-sm text-background transition-opacity disabled:opacity-30"
          >
            가입하기
          </button>
        </div>
      </div>
    </div>
  );
}
