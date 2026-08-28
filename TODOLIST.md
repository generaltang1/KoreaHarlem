# TODO LIST — KoreaHarlem

다른 PC에서 이어 작업할 때 **이 파일을 먼저** 읽으세요.  
기준: Cafe24형 일반 몰 · KoreaHarlem 브랜드 UI · 토스페이먼츠 심사 대비

프로덕션: https://korea-harlem.vercel.app  
스택: Next.js 15 + Supabase + Vercel + Toss Payments

> **2026-08-26 (최신):** **제보하기** 배포 — Footer Newsletter 제거 · 제보 팝업 · Admin 제보 관리 · SQL 실행됨

---

## 0) PC 전환 체크리스트

### A. 코드
1. `git pull` (또는 이번 PC에서 커밋·푸시 후 pull)
2. `npm install` (필요 시) → `.env.local` 확인
3. `npm run dev` — **CSS 깨질 때:** 예전 `next dev` 프로세스 종료 → `.next` 삭제 → 재시작 (3000 포트 확인)

### B. Supabase SQL

| 파일 | 용도 | 상태 |
|------|------|------|
| `add_order_cs_requests.sql` | CS 요청·상태이력 | 실행함 |
| `add_stock_adjustment_logs.sql` | 수기 재고 조정 | 실행함 |
| `add_product_category.sql` | IN STORE `category`/`subcategory` | **실행함** |
| `add_exchange_stock_hold.sql` | 교환 hold RPC | **실행함** |
| `add_tip_reports.sql` | 제보하기 테이블·tips 버킷 | **실행함** |
| `add_product_show_stock.sql` | 재고표시상태 `show_stock` | **미실행** |
| `add_order_shipping.sql` | 송장·배송 | 실행함 |
| `alter_restore_stock_preparing.sql` | restore 상태 확장 | 실행함 |

> `is_published` / `is_sale` 컬럼은 `add_products.sql` 초기 스키마에 포함. **별도 SQL 불필요.**

### C. 환경 변수
`NEXT_PUBLIC_SUPABASE_*` · `SUPABASE_SERVICE_ROLE_KEY` · `TOSS_*` · 카카오 OAuth  
Vercel Production에 `SUPABASE_SERVICE_ROLE_KEY`·`TOSS_*` 등록 후 **Redeploy** 필요 (변경만으로는 반영 안 됨).

---

## 1) 우선순위 로드맵 (2026-08 확정)

| 순위 | 항목 | 상태 |
|------|------|------|
| **1** | **메뉴 정리 (IA/네비) + 상품 카테고리** | **코드 완료** · iPad 탭 드롭다운 배포 · Admin 메뉴 분류·기존 상품 카테고리 지정 잔여 |
| **2** | **이용안내 · 환불정책 (토스 심사)** | **부분 완료** — Footer·상품 상세 정책 배포 · 체크리스트·결제 E2E 잔여 |
| **3** | **진열/판매 상태 + 장바구니 UX + 품절 숨김** | **완료** · 배포됨 |
| 4+ | 쇼핑 E2E·토스 심사 · **제보하기** · **Magazine** | 쇼핑 테스트 중 · 콘텐츠 개발 착수 |

### 공개 메뉴 IA (확정 · 반영됨)

| 순서 | 메뉴 | 경로 | 비고 |
|------|------|------|------|
| 1 | **In Store** | `/sale` | Shop All = 전체 |
| 1-2 | Merch | `?category=merch&sub=tops\|bottoms\|accessory` | 2단 드롭다운 |
| 1-3 | CD | `?category=cd` | |
| 1-4 | Ticket | `?category=ticket` | |
| 2 | **Music** | `/artists` | 아티스트 → 앨범 → 재생 |
| 3 | **Think** | `/think` | Coming Soon |
| 4 | **Magazine** | `/magazine/culture` · `/magazine/news` | Coming Soon |

**제거됨:** Explore · Sale · 아티스트 · 이벤트 (구 헤더) · Admin **작품 등록** (`/admin/works/new`)

**상품 카테고리 규칙**
- Admin 등록·수정: **In Store 카테고리 필수** (Merch → Tops/Bottoms/Accessory 필수)
- `category` null인 기존 상품 → **Shop All에만** 노출 · Admin에서 직접 지정
- DB 값: `merch`/`cd`/`ticket` + Merch만 `subcategory`

**진열/판매/재고 공개 노출 (Cafe24형)**

| 조건 | 공개 목록(메인·In Store) | 상세·구매 |
|------|--------------------------|-----------|
| `is_published` = 진열안함 | 비노출 | — |
| `stock` ≤ 0 (품절) | **비노출** (`stock > 0`만) | URL 직접 접근 시 Sold out |
| `is_sale` = 판매안함 | 진열·재고 있으면 노출 | 구매·장바구니·결제 불가 |
| `show_stock` = 표시안함 | (목록 영향 없음) | 남은 재고 수량 숨김 · 품절만 표시 |
| Admin 재고 조정 → `sync_product_total_stock` | 재고 생기면 목록에 다시 노출 | |

SQL: `supabase/add_product_show_stock.sql` (실행 필요)

**정렬:** `created_at` 내림차순 (최신 등록 상품 우선)

**주요 파일**
| 구분 | 경로 |
|------|------|
| nav 정의 | `src/data/navigation.ts` |
| 헤더 드롭다운 (클릭/터치 토글) | `src/components/layout/NavMenu.tsx` |
| 카테고리 상수 | `src/lib/productCategories.ts` |
| 진열/판매 폼 | `src/components/admin/ProductForm.tsx` |
| In Store 필터 | `src/app/sale/page.tsx` · `src/lib/productSearch.ts` |
| 메인 상품 | `src/app/page.tsx` |
| 장바구니 상태 검증 | `src/lib/cartAvailability.ts` · `src/hooks/useCartProductAvailability.ts` |
| 이용안내 | `src/data/usageGuide.ts` · `src/app/guide/page.tsx` · `UsageGuideModal` |
| 상품 상세 정책 | `src/components/commerce/ProductPolicyNotice.tsx` |

---

## 2) 신규 기능 백로그

### ★ 우선 작업

#### 1순위 — 메뉴·카테고리 (2026-08-13)
- [x] 헤더/푸터: In Store · Music · Think · Magazine
- [x] In Store 하위: Shop All / Merch(Tops·Bottoms·Accessory) / CD / Ticket
- [x] `/think` · `/magazine/culture` · `/magazine/news` 플레이스홀더
- [x] Music → `/artists` · `/music` redirect 정리
- [x] `products.category` / `subcategory` + Admin 필수 선택 + Sale 필터
- [x] SQL `add_product_category.sql` 실행
- [x] Admin **작품 등록** 메뉴·페이지 제거
- [x] **iPad/터치:** In Store·Magazine 드롭다운 **탭 토글** (`NavMenu.tsx`, `4db392d` 배포)
- [ ] **기존 상품 카테고리 일괄 지정** (Admin에서 수동)
- [ ] **Admin 메뉴 분류** (다음 단계)
- [x] 커밋 · 푸시 · Vercel 배포 (메뉴 IA·카테고리)

#### 2순위 — 이용안내 · 환불정책 (토스 심사)
- [x] Footer **이용안내** 모달 (결제·배송·교환/반품·**환불안내**)
- [x] 전용 페이지 `/guide` · `#shipping` · `#refund` 앵커
- [x] 결제 페이지 약관 동의 → **이용안내**·**환불정책** 링크
- [x] 상품 상세 **배송·교환·환불** 요약 + `/guide` 링크 (`ProductPolicyNotice` · `/sale/[id]`)
- [x] 상품 상세 정책 안내 **커밋 · 배포**
- [x] Footer **대표자명 · 주소 · 전화** (`Footer.tsx`, 2026-08-14 배포)
- [ ] 이용약관 본문과 **환불/청약철회** 문구 정합성 검토 (필요 시 TermsModal 보강)
- [ ] 토스페이먼츠 **심사 체크리스트** 전체 점검 (아래 상세)

##### 토스페이먼츠 심사 체크리스트 (카드사·PG 심사)

> 참고: [전자결제 심사 한 번에 통과](https://www.tosspayments.com/blog/articles/semo-7) · 심사 URL: `https://korea-harlem.vercel.app` (도메인 후 `.com` 교체 가능) · Auth SMTP(Resend)와 **무관**

**점검 방법:** 배포 URL을 고객처럼 훑기 → 아래 표 ✅/❌ → 미비 보완 → 토스 **전자청약·심사 신청** + 서류(사업자등록증·정산계좌·신분증 등)

| 구분 | 항목 | 상태 | 비고 |
|------|------|------|------|
| **상품** | 판매 가능 상품 1개 이상 (품절·샘플만 X) | [ ] | Admin: 진열함 + **판매함** + 재고 |
| | 상품 이미지 고유·가독 (No image·중복 X) | [ ] | |
| | 상품 상세에 배송·환불 정책 노출 | [x] | `ProductPolicyNotice` |
| **Footer 법적 필수** | 상호명 | [x] | KoreaHarlem |
| | 사업자등록번호 | [x] | 569-09-02645 |
| | 통신판매업 신고번호 | [x] | 2024-서울마포-2977 |
| | **대표자명** | [x] | 장재혁 |
| | **사업장 주소** | [x] | 서울 마포구 동교로 183-6, 104호 (동교동) |
| | **유선번호** (070·휴대폰 가능) | [x] | 010-5828-5171 |
| | 대표 이메일 | [x] | koreaharlem@gmail.com |
| **약관·정책** | 이용약관 · 개인정보처리방침 | [x] | Footer 모달 |
| | 이용안내(배송·교환·환불) | [x] | `/guide` · Footer |
| | 이용약관 ↔ `/guide` 환불 문구 정합성 | [ ] | |
| **결제** | **비회원 구매** 가능 | [x] | 결제 + `/order-inquiry` |
| | 테스트 결제 E2E (주문→성공→Admin) | [ ] | `test_ck_` / `test_sk_` |
| | **라이브 키** Vercel Production (`live_ck_` / `live_sk_`) | [ ] | 심사·운영 URL |
| | 웹훅 등록 | [ ] | `…/api/payments/toss/webhook` |
| | Admin 환불·취소 1회 테스트 | [ ] | |
| **신청** | 토스 전자청약 + 심사 URL 제출 | [ ] | 미비 수정 후 재신청 |

**Footer 사업자 정보** — `src/components/layout/Footer.tsx` (2026-08-14 배포)

```
대표자: 장재혁
주소: 서울 마포구 동교로 183-6, 104호 (동교동)
전화: 010-5828-5171
이메일: koreaharlem@gmail.com
```

**심사 전 권장 순서:** Footer 배포 확인 → 판매함 상품 1개 + 결제 E2E → 라이브 키·웹훅 확인 → 토스 신청

#### 3순위 — 진열/판매 + 장바구니 + 품절 목록 (배포됨)
- [x] Admin **표시 설정**: 진열상태 · 판매상태 (라디오)
- [x] In Store·메인: `is_published` + **`stock > 0`** (품절 숨김) · 최신순
- [x] 상품 상세: 판매안함 → 구매/장바구니 비활성 + 안내 문구
- [x] 주문 API: 진열안함·판매안함 상품 주문 차단
- [x] 장바구니·결제: 구매 불가 상품 **회색 + 뱃지** · 결제 시 **alert** 차단
- [x] 커밋 · 푸시 · Vercel 배포 (`b05da43` 품절 숨김 포함)

---

### 계정 · 인증

#### 아이디/비밀번호 찾기 (2026-08-13)

**코드** — 배포됨 (`korea-harlem.vercel.app`)

| 경로 | 역할 |
|------|------|
| `/forgot-password` | 이메일 입력 → `resetPasswordForEmail` |
| `/auth/confirm` | 메일 `token_hash` 검증 → 세션 생성 |
| `/auth/reset-password` | 새 비밀번호 → `updateUser({ password })` |
| `/find-id` | 로그인 ID = 가입 이메일 안내 · OAuth 안내 |
| `/login` | 아이디 찾기 · 비밀번호 찾기 링크 |

**주요 파일:** `src/lib/auth/passwordReset.ts` · `src/components/auth/*` · `src/app/auth/confirm/route.ts`

- [x] 비밀번호 찾기 · 아이디 찾기 · OAuth 안내 UI
- [x] 로그인 페이지 링크 추가
- [x] **커밋 · 푸시 · Vercel 배포**
- [ ] `/forgot-password` → 메일 → 재설정 → 로그인 **E2E 테스트**

#### Supabase Auth 설정 (Dashboard)

**URL Configuration** — ✅ 완료 (추가 불필요)

| 항목 | 값 |
|------|-----|
| Site URL | `https://korea-harlem.vercel.app` |
| Redirect URLs | `https://korea-harlem.vercel.app/**` · `http://localhost:3000/**` · `https://*.vercel.app/**` 등 |

> **Site URL ≠ 실제 도메인.** Auth·메일 링크(`{{ .SiteURL }}`)용. 사이트 주소 변경은 **Vercel 도메인 연결** 후 Site URL·Redirect URLs를 같이 수정.

**Reset password 이메일 템플릿** — ✅ 저장됨 (Authentication → Emails → Reset password)

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password">
  비밀번호 재설정
</a>
```

- [x] Recovery 템플릿 PKCE 링크 (`/auth/confirm` → `/auth/reset-password`)
- [ ] (선택) Confirm signup 템플릿도 동일 패턴 (`type=email`)
- [ ] (선택) Subject 한글화 (`비밀번호 재설정`)

**지금 (도메인 없음):** Supabase **기본 메일** 사용 — 시간당 **2통** · 본인 테스트용. Redirect URLs는 `/**` 와일드카드로 auth 경로 포함됨.

#### Resend SMTP (운영 · 도메인 준비 후)

> Auth 메일(비밀번호 찾기·회원가입 확인)은 **Vercel이 아닌 Supabase SMTP**에 연결. Vercel Marketplace Resend는 `RESEND_API_KEY`(앱에서 직접 발송)용.

**선행 조건:** `koreaharlem.com`(또는 서브도메인) DNS → Resend **Domains** 인증. `*.vercel.app`은 Resend에 등록 불가.

| 단계 | 작업 | 상태 |
|------|------|------|
| 1 | [resend.com](https://resend.com) 가입 · API Key (`re_...`) | [ ] |
| 2 | Resend Domains → DNS(SPF/DKIM) 추가 → Verify | [ ] |
| 3 | Supabase → Authentication → Emails → **SMTP Settings** | [ ] |

**Supabase SMTP 값 (Resend 공식):**

| 항목 | 값 |
|------|-----|
| Enable Custom SMTP | ON |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | Resend API Key |
| Sender email | `noreply@<인증된-도메인>` (예: `noreply@koreaharlem.com`) |
| Sender name | `KoreaHarlem` |

**대안:** Resend Dashboard → Settings → Integrations → **Supabase Connect** (SMTP 자동 설정)

**도메인 연결 후 추가 작업:**

- [ ] Supabase Site URL → `https://koreaharlem.com` (또는 www)
- [ ] Redirect URLs에 `https://koreaharlem.com/**` 추가
- [ ] Vercel에 커스텀 도메인 연결
- [ ] SMTP 연결 후 비밀번호 찾기 메일 재테스트 (Resend Activity 로그 확인)

**참고:** Resend 무료 ~3,000통/월 · Supabase SMTP 설정 자체는 무료 · 저장 후 Password 칸 비어 보임 = 마스킹(정상)

### 음악 플레이어
3. [x] 앨범 종료 후 **다른 앨범 랜덤 재생** (반복 끔 = 기본 · `/api/music/random-queue`)
4. [x] **셔플** (하단 재생바 on/off · 유튜브 뮤직 스타일 아이콘)
- [x] **반복** 3단계: 끔 → 모두 반복(●) → 한 곡 반복(1)
- [x] 앱 음량 슬라이더 (모바일 포함) · `audio.muted` 음소거 · localStorage 저장
6. [ ] 앨범 상세 **우측 다른 앨범 추천**

### 음악 커뮤니티 · 판매
5. [ ] 앨범 **댓글/평가** (커뮤니티)
9. [ ] **음원/앨범 유료 판매 + mp3/wav 다운로드**

### 콘텐츠 · CMS
7. [ ] 상품·앨범 **예약 업로드 + 임시저장**
8. [ ] 아티스트 **프로필 사진 여러 장** + 대표 설정·갤러리
10. [ ] **한정판매** 체크 + 잔여 수량 강조

---

### ★ 다음 개발 (쇼핑 테스트와 병행 · 2026-08-21)

쇼핑 코어(상품→주문→조회→CS)는 **사용자 테스트 진행 중**. 그 결과를 기다리며 아래를 우선 개발.

#### A. 제보하기 (2026-08-26)
- [x] Footer Newsletter 제거 → **제보하기** 버튼 + 팝업
- [x] 제목 · contentEditable 본문(이미지 붙여넣기) · 이미지/동영상 첨부
- [x] 회원·비회원 제출 (`POST /api/tips`, service role 업로드)
- [x] Admin **제보하기 관리** 목록·상세·삭제 (`/admin/tips`)
- [x] **SQL 실행:** `supabase/add_tip_reports.sql`
- [ ] (선택) 접수 알림 메일 — Resend/SMTP는 도메인 후
- [x] 커밋 · 배포 · QA

> 진입점: Footer 하단 Tip 영역. 관리: Admin 메뉴 «제보하기 관리».

#### B. Magazine
- [ ] IA 확정: Culture / News (기존 플레이스홀더 `/magazine/culture` · `/magazine/news`)
- [ ] 매거진 글 스키마 (제목·본문·커버·카테고리·발행일·진열)
- [ ] Admin 매거진 등록·수정·목록
- [ ] 공개 목록·상세 UI (Coming Soon 해제)
- [ ] 메인 `HomeSections` MAGAZINE 패널 연동 (선택)
- [ ] 커밋 · 배포 · QA

> 관련 백로그(플레이어·커뮤니티·CMS 7·8·10)는 Magazine/제보 이후 또는 병행.

---

## 3) 기존 커머스 · CS (완료 / 잔여)

### 완료
- [x] 주문·토스·비회원 조회·재고
- [x] 회원 주문·셀프 취소·관리자 배송/송장
- [x] 회원 CS · 교환 hold · 수기 재고 · Cafe24형 재고 UX
- [x] 비회원 조회 CS·송장 이력 · 일괄 상태 · 타임라인 · 웹훅 · 부분환불 UI
- [x] Cafe24형 **진열/판매 상태** · 장바구니 구매불가 UX
- [x] 메인·In Store **품절 상품 숨김** (`stock > 0`) · 최신순 (`b05da43`)

### 비회원 CS 요청 (2026-08-21 · **배포됨**)

| 경로/파일 | 역할 |
|-----------|------|
| `POST /api/orders/[id]/guest-cs-request` | 주문조회 비밀번호로 반품/교환/환불 접수 |
| `src/lib/createOrderCsRequest.ts` | 회원·비회원 공용 CS 생성 |
| `/order-inquiry` | 조회 후 **요청하기** 폼 |
| lookup 응답 | 인증 후 `order.id` 포함 |

- [x] guest-cs-request API · OrderCsRequestForm 비회원 연동
- [x] 회원 `cs-request` → 공용 헬퍼 리팩터
- [x] **커밋 · 푸시 · Vercel 배포**
- [ ] E2E: 배송중/완료 비회원 주문 → 요청 → Admin 승인·검수·처리 완료

**Admin CS 처리** (`AdminCsPanel` · 회원·비회원 동일)

| 버튼 | 시점 | 동작 |
|------|------|------|
| 승인 | 요청접수 | 수락. 교환이면 희망 사이즈 재고 hold |
| 반려 | 요청/승인 | 거절·주문 상태 복구 |
| 회수·검수 완료 | 반품·교환 | 물품 확인 |
| 처리 완료 | 요청~검수 | 반품·환불=토스 환불(+재고복구) / 교환=사이즈·재고 완료 |

권장: 반품 = 승인 → 검수 → 처리 완료 · 교환 = 승인 → 검수 → 처리 완료 · 환불만 = (승인) → 처리 완료

### 잔여
- [ ] 비회원 배송 전 취소 (선택)
- [ ] 교환 차액 (사이즈별 가격 후)
- [ ] 라이브 키 + 라이브 웹훅 (심사 후)
- [ ] CS / hold / 수기재고 / **진열·판매·장바구니·품절숨김** QA

---

## 4) QA (짧게)

- [ ] In Store: Shop All / Merch / CD / Ticket 필터·상품 노출
- [ ] 메인·In Store에 **품절 상품이 안 보이는지** · 재고 올리면 다시 노출
- [ ] Admin: 기존 상품 카테고리 저장 후 해당 메뉴에 표시
- [ ] Admin: 진열안함 / 판매안함 저장 → 목록·상세·장바구니·결제 동작
- [ ] 장바구니 담은 뒤 Admin에서 상태 변경 → **구매 불가** 표시·결제 alert
- [x] Footer **이용안내** · `/guide` · 결제 페이지 환불 링크
- [x] Footer **대표자명 · 사업장 주소 · 유선번호** (배포됨)
- [x] 상품 상세 **배송·교환·환불** 섹션 (`/sale/[id]` · 배포됨)
- [ ] iPad: In Store · Magazine **탭으로 드롭다운** 열림
- [ ] Music → Artists → Album → 재생
- [ ] Think / Magazine Coming Soon
- [ ] `/forgot-password` · `/find-id` · 로그인 링크 · 비밀번호 재설정 E2E
- [ ] `/order-inquiry` 비회원 CS 요청 · Admin 처리 (배포 후)

---

## 5) 한 줄 요약 — 지금 할 일

1. **다음 개발:** **Magazine** (Culture/News)  
2. **토스 심사** — 라이브 키·웹훅·전자청약  
3. (선택) Admin 메뉴 분류 · Resend SMTP (도메인 후) · 제보 접수 알림 메일
