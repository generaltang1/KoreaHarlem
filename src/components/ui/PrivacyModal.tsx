"use client";

import { useEffect } from "react";

interface PrivacyModalProps {
  onClose: () => void;
}

export function PrivacyModal({ onClose }: PrivacyModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <h2 className="text-sm font-medium">개인정보처리방침</h2>
          <button
            onClick={onClose}
            className="text-xs text-muted transition-colors hover:text-foreground"
            aria-label="닫기"
          >
            닫기
          </button>
        </div>

        {/* 본문 */}
        <div className="px-6 py-6 text-xs leading-7 text-foreground [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-medium">
          <p className="mb-6 text-muted">
            KoreaHarlem(이하 &lsquo;회사&rsquo;라 한다)는 개인정보 보호법 제30조에 따라 정보
            주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수
            있도록 하기 위하여 다음과 같이 개인정보 처리지침을 수립, 공개합니다.
          </p>

          <h3>제1조 (개인정보의 처리목적)</h3>
          <p className="text-muted">
            회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는
            다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는
            개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할
            예정입니다.
          </p>
          <p className="mt-3 text-muted">
            1. 홈페이지 회원 가입 및 관리<br />
            회원 가입 의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리,
            서비스 부정 이용 방지, 만 14세 미만 아동의 개인정보처리 시 법정대리인의 동의 여부
            확인, 각종 고지·통지, 고충 처리 등을 목적으로 개인정보를 처리합니다.
          </p>
          <p className="mt-3 text-muted">
            2. 재화 또는 서비스 제공<br />
            물품 배송, 서비스 제공, 계약서 및 청구서 발송, 콘텐츠 제공, 맞춤서비스 제공,
            본인인증, 연령인증, 요금 결제 및 정산, 채권추심 등을 목적으로 개인정보를 처리합니다.
          </p>
          <p className="mt-3 text-muted">
            3. 고충 처리<br />
            민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지, 처리 결과 통보 등의
            목적으로 개인정보를 처리합니다.
          </p>

          <h3>제2조 (개인정보의 처리 및 보유기간)</h3>
          <p className="text-muted">
            ① 회사는 법령에 따른 개인정보 보유·이용 기간 또는 정보주체로부터 개인정보를 수집
            시에 동의 받은 개인정보 보유·이용 기간 내에서 개인정보를 처리·보유합니다.<br /><br />
            ② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.<br /><br />
            1. 홈페이지 회원 가입 및 관리 : 사업자/단체 홈페이지 탈퇴 시까지<br />
            다만, 다음의 사유에 해당하는 경우에는 해당 사유 종료 시까지<br />
            1) 관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우에는 해당 수사·조사 종료 시까지<br />
            2) 홈페이지 이용에 따른 채권 및 채무관계 잔존 시에는 해당 채권·채무 관계 정산 시까지<br /><br />
            2. 재화 또는 서비스 제공 : 재화·서비스 공급완료 및 요금결제·정산 완료 시까지<br />
            다만, 다음의 사유에 해당하는 경우에는 해당 기간 종료 시까지<br />
            1) 「전자상거래 등에서의 소비자 보호에 관한 법률」에 따른 기록<br />
            - 표시·광고에 관한 기록 : 6월<br />
            - 계약 또는 청약 철회, 대금결제, 재화 등의 공급기록 : 5년<br />
            - 소비자 불만 또는 분쟁 처리에 관한 기록 : 3년<br />
            2) 「통신비밀보호법」 제41조에 따른 통신사실확인자료 보관<br />
            - 가입자 전기통신일시, 개시·종료 시간 등 : 1년<br />
            - 컴퓨터 통신, 인터넷 로그 기록자료, 접속지 추적자료 : 3개월
          </p>

          <h3>제3조 (개인정보의 제3자 제공)</h3>
          <p className="text-muted">
            ① 회사는 정보주체의 개인정보를 제1조에서 명시한 범위 내에서만 처리하며,
            정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에
            해당하는 경우에만 개인정보를 제3자에게 제공합니다.<br /><br />
            ② 회사는 원활한 서비스 제공을 위해 필요 최소한의 범위로만 개인정보를 제3자에게
            제공할 수 있습니다.
          </p>

          <h3>제4조 (개인정보처리의 위탁)</h3>
          <p className="text-muted">
            ① 회사는 원활한 개인정보 업무처리를 위하여 개인정보 처리업무를 위탁하고 있습니다.<br /><br />
            ② 회사는 위탁계약 체결 시 개인정보 보호법 제25조에 따라 위탁업무 수행목적 외
            개인정보 처리금지, 기술적·관리적 보호조치 등 책임에 관한 사항을 계약서에 명시하고,
            수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.<br /><br />
            ③ 위탁업무의 내용이나 수탁자가 변경될 경우에는 본 개인정보 처리방침을 통하여
            공개하도록 하겠습니다.
          </p>

          <h3>제5조 (정보주체 및 법정대리인의 권리와 그 행사 방법)</h3>
          <p className="text-muted">
            ① 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할
            수 있습니다.<br />
            1. 개인정보 열람 요구<br />
            2. 오류 등이 있을 경우 정정 요구<br />
            3. 삭제요구<br />
            4. 처리정지 요구<br /><br />
            ② 제1항에 따른 권리 행사는 서면, 전화, 전자우편 등을 통하여 하실 수 있으며
            회사는 이에 대해 지체없이 조치하겠습니다.
          </p>

          <h3>제6조 (처리하는 개인정보 항목)</h3>
          <p className="text-muted">
            1. 홈페이지 회원 가입 및 관리<br />
            필수항목 : 성명, 생년월일, 아이디, 비밀번호, 주소, 전화번호, 이메일주소<br />
            선택항목 : 관심 분야<br /><br />
            2. 재화 또는 서비스 제공<br />
            필수항목 : 성명, 생년월일, 아이디, 비밀번호, 주소, 전화번호, 이메일주소, 결제정보<br />
            선택항목 : 관심분야, 과거 구매내역
          </p>

          <h3>제7조 (개인정보의 파기)</h3>
          <p className="text-muted">
            ① 회사는 개인정보 보유 기간의 경과, 처리목적 달성 등 개인정보가 불필요하게
            되었을 때에는 지체없이 해당 개인정보를 파기합니다.<br /><br />
            ③ 개인정보 파기의 절차 및 방법<br />
            1. 파기 절차 : 파기 사유가 발생한 개인정보를 선정하고, 개인정보 보호책임자의 승인을
            받아 파기합니다.<br />
            2. 파기 방법 : 전자적 파일 형태의 정보는 기록을 재생할 수 없도록 파기하며, 종이
            문서는 분쇄기로 분쇄하거나 소각하여 파기합니다.
          </p>

          <h3>제8조 (개인정보의 안전성 확보조치)</h3>
          <p className="text-muted">
            회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 하고 있습니다.<br />
            1. 관리적 조치 : 내부관리계획 수립 및 시행, 정기적 직원 교육 등<br />
            2. 기술적 조치 : 접근 권한 관리, 접근통제시스템 설치, 암호화, 보안프로그램 설치<br />
            3. 물리적 조치 : 전산실, 자료보관실 등의 접근통제
          </p>

          <h3>제9조 (개인정보 자동 수집 장치의 설치·운영 및 거부에 관한 사항)</h3>
          <p className="text-muted">
            ① 회사는 이용자에게 개별적인 맞춤 서비스를 제공하기 위해 이용정보를 저장하고
            수시로 불러오는 &lsquo;쿠키(cookie)&rsquo;를 사용합니다.<br /><br />
            ② 쿠키는 웹사이트 서버가 이용자의 브라우저에 보내는 소량의 정보이며 이용자들의
            PC 또는 모바일에 저장됩니다.<br /><br />
            ③ 정보주체는 웹 브라우저 옵션 설정을 통해 쿠키 허용, 차단 등의 설정을 할 수
            있습니다. 다만, 쿠키 저장을 거부할 경우 맞춤형 서비스 이용에 어려움이 발생할 수
            있습니다.
          </p>

          <h3>제10조 (개인정보 보호책임자)</h3>
          <p className="text-muted">
            ▶ 개인정보 보호책임자<br />
            성명 : KoreaHarlem 담당자<br />
            연락처 : koreaharlem@gmail.com<br /><br />
            ② 정보주체께서는 서비스 이용 중 발생한 모든 개인정보 보호 관련 문의, 불만 처리,
            피해구제 등에 관한 사항을 개인정보 보호책임자에게 문의하실 수 있습니다.
          </p>

          <h3>제11조 (개인정보 열람청구)</h3>
          <p className="text-muted">
            정보주체는 개인정보 보호법 제35조에 따른 개인정보의 열람 청구를 아래의 연락처로
            할 수 있습니다.<br />
            연락처 : koreaharlem@gmail.com
          </p>

          <h3>제12조 (권익침해 구제 방법)</h3>
          <p className="text-muted">
            정보주체는 아래의 기관에 대해 개인정보 침해에 대한 피해구제, 상담 등을 문의하실
            수 있습니다.<br />
            1. 개인정보 분쟁조정위원회 : (국번없이) 1833-6972 (www.kopico.go.kr)<br />
            2. 개인정보침해신고센터 : (국번없이) 118 (privacy.kisa.or.kr)<br />
            3. 대검찰청 : (국번없이) 1301 (www.spo.go.kr)<br />
            4. 경찰청 : (국번없이) 182 (ecrm.police.go.kr/minwon/main)
          </p>

          <h3>제13조 (개인정보 처리방침 시행 및 변경)</h3>
          <p className="text-muted">
            이 개인정보 처리방침은 2026년 1월 1일부터 적용됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
