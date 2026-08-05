# TODO LIST — KoreaHarlem 주문/결제/관리

다른 PC에서 이어 작업할 때 **이 파일을 먼저** 읽고, 아래 «PC 전환 체크리스트»부터 진행하세요.  
기준: Cafe24형 일반 몰 프로세스 · KoreaHarlem 브랜드 UI 유지

---

## 0) PC 전환 체크리스트 (필수)

### A. 코드 동기화
CS + 재고 수기 조정은 `main`에 푸시·Vercel 배포됨 (다른 PC는 `git pull`).

1. 다른 PC: `git pull`
2. `npm install` (의존성 변경 있을 때만)
3. `.env.local` 복사 확인 (아래 환경 변수)
4. `npm run dev` / 필요 시 `npm run build`

### B. Supabase SQL (프로젝트 DB는 공통 — 한 번만 실행)

| 파일 | 용도 | 상태 (이 PC 기준) |
|------|------|-------------------|
| `supabase/add_order_cs_requests.sql` | CS 요청·상태이력 · restore에 return_* 허용 | **실행함** |
| `supabase/add_stock_adjustment_logs.sql` | 수기 조정 이력 · `adjust_product_size_stock` | **실행함** |
| `supabase/add_exchange_stock_hold.sql` | 교환 hold/release/complete RPC | **미실행 → 지금 실행** |
| `supabase/add_order_shipping.sql` | 송장·배송 컬럼 | 이전에 실행 |
| `supabase/alter_restore_stock_preparing.sql` | preparing 등 restore 허용 | 이전에 실행 |

SQL Editor에서 위 파일 순서대로 «아직 안 돌린 것만» 실행. 이미 만든 테이블/정책이 있으면 에러날 수 있음 → 무시하거나 해당 구간만 스킵.

### C. 환경 변수 (`.env.local` / Vercel)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` ← 관리자 API·재고 RPC에 필수
- `TOSS_SECRET_KEY`, `NEXT_PUBLIC_TOSS_CLIENT_KEY` (또는 프로젝트에 맞는 Toss 키 이름)
- 카카오 OAuth 등 기존 로그인 키

프로덕션: https://korea-harlem.vercel.app  
스택: Next.js 15 + Supabase + Vercel + Toss Payments

---

## 1) 운영 정책 (확정)

결제·일부 취소는 자동에 가깝게, **배송·CS는 관리자 상태 관리**.

| 단계 | 상태 | 누가 |
|------|------|------|
| 주문 생성 | `pending` | 시스템 |
| 결제 성공 | `paid` | 시스템(토스) |
| 출고 준비 | `preparing` | 관리자 |
| 송장/배송중 | `shipped` | 관리자 |
| 배송완료 | `delivered` | 관리자 |
| 배송 전 취소 | `cancelled` / `refunded` | 구매자·관리자 (+토스) |
| 배송 후 반품·교환·환불 | 요청→승인/검수→완료 | **회원·비회원** 요청 → 관리자 |
| 예외(수동 송금 등) | — | 관리자 + **수기 재고** |

재고: 주문 시 차감 · 결제실패/배송전취소 복구 · 반품은 **검수 후 처리완료 시** 복구 · 실재고 불일치는 수기 조정

**비회원 CS (Cafe24형):** 주문번호+이름+비밀번호로 `/order-inquiry` 인증에 성공하면, 회원과 동일하게 반품·교환·환불 **요청**까지 가능해야 함. (현재는 이력 조회만 됨)

---

## 2) 구현 완료 (코드 기준)

> CS·수기조정 포함해 `main` 배포. 최신 커밋은 `git log -1`으로 확인.

### 주문·결제·회원
- [x] 주문서 + 토스 · 비회원 `/order-inquiry` · 재고 예약/복구
- [x] `/mypage/orders` 목록·필터·상세 · 배송 전 셀프 취소 (`POST /api/orders/[id]/cancel`)
- [x] 관리자 배송: 준비중 / 송장·배송중 / 배송완료 (`POST /api/admin/orders/[id]/shipping`)

### 반품·교환·환불 CS
- [x] DB: `order_cs_requests`, `order_status_histories`
- [x] 구매자(회원): `/mypage/orders/[id]` — `OrderCsRequestForm` (`POST /api/orders/[id]/cs-request`)
- [x] 관리자: 주문 상세 `AdminCsPanel` — 승인/반려/회수·검수/처리완료  
  (`POST /api/admin/orders/[id]/cs/[requestId]`, 완료 시 토스 환불·재고 복구 옵션)
- [x] 헬퍼: `src/lib/csRequests.ts`, 주문 상태 확장: `src/lib/orders.ts`
- [x] 교환 사이즈 재고 hold (`add_exchange_stock_hold.sql`) — 승인 hold · 반려 해제 · 완료 시 원사이즈 복구/`order_items` 갱신
- [ ] 교환 차액 정산 — 사이즈별 가격 도입 후 (현재 `price_krw` 공통)
- [x] 비회원 주문조회에 CS·송장·취소 **이력 표시**
- [ ] **비회원 CS 요청** — 주문조회 인증 후 반품/교환/환불 접수 (↓ P0)

### 재고 수기 조정
- [x] DB: `stock_adjustment_logs` + RPC `adjust_product_size_stock`
- [x] API: `GET/POST /api/admin/products/[id]/stock-adjust`
- [x] UI: `/admin/products/[id]/edit` — `StockAdjustPanel` (±수량·사유·이력)
- [x] 페이지: `page.tsx` → `@/components/admin/EditProductPage` (로컬 `EditProductPage.tsx`는 제거됨)
- [x] Cafe24형 재고 UX: 신규=절대값 초기 재고 / 수정=읽기 전용 + 수기 조정(±·이력)만

### 주요 경로 빠른 찾기
| 기능 | 경로 |
|------|------|
| CS SQL | `supabase/add_order_cs_requests.sql` |
| 교환 hold SQL | `supabase/add_exchange_stock_hold.sql` |
| 수기조정 SQL | `supabase/add_stock_adjustment_logs.sql` |
| 회원 CS 요청 UI | `src/components/commerce/OrderCsRequestForm.tsx` |
| 비회원 주문조회 | `src/app/order-inquiry/page.tsx` · `POST /api/orders/lookup` |
| 관리자 CS | `src/components/admin/AdminCsPanel.tsx` |
| 수기 조정 UI | `src/components/admin/StockAdjustPanel.tsx` |
| 주문 상태/라벨 | `src/lib/orders.ts` |
| 관리자 API 가드 | `src/lib/adminApi.ts` (`assertAdminApi`) |
| 서비스롤 클라이언트 | `src/lib/supabase/admin.ts` (`createServiceClient`) |

---

## 3) 다음 작업 (우선순위)

### P0 — 최우선: 비회원 CS 요청 (Cafe24형)

> Cafe24는 비회원도 주문조회(주문번호+비번) 후 반품/교환 등을 신청하는 경우가 많음.  
> 우리는 이력 조회만 되고 **요청 접수가 막혀 있음** → 이 갭을 먼저 메움.

**목표:** `/order-inquiry`에서 조회 성공한 비회원 주문이, 회원과 동일하게 반품·교환·환불을 **요청**할 수 있게 한다.

**현재 갭**
- UI: 조회 후 `OrderCsRequestsSection`(이력)만 있음 · `OrderCsRequestForm` 없음
- API: `POST /api/orders/[id]/cs-request`가 **로그인(회원) 필수**
- DB: `order_cs_requests.user_id` nullable이라 비회원 insert는 스키마상 가능

**구현 범위**
1. [ ] **인증된 비회원 CS API**  
   - 예: `POST /api/orders/[id]/cs-request`에 guest 경로 추가, 또는 `POST /api/orders/guest-cs-request`  
   - Body: 기존 CS 필드 + `name` / `orderNumber` / `password` (lookup과 동일 검증: `guest_password_hash`)  
   - `user_id`는 null로 저장 · open CS 중복 방지 · `canRequestCs` · 교환 시 `orderItemId`+사이즈 검증은 회원과 동일  
   - 성공 시 주문 상태·`order_status_histories` 갱신 (기존과 동일)
2. [ ] **UI** — `/order-inquiry` 조회 성공 후  
   - `OrderCsRequestForm` 노출 (items·orderId·status·hasOpenRequest 전달)  
   - 교환 시 상품 선택 가능하도록 lookup 응답에 `order.id` + items `id`/`product_id` 포함
3. [ ] **(선택) 비회원 배송 전 취소** — Cafe24형이면 주문조회에서 셀프 취소도 같은 인증으로 열지 검토  
   - 이번 P0 핵심은 CS 요청; 취소는 여유 있으면 함께, 없으면 P0.1로 분리
4. [ ] **보안** — rate limit/동일 실패 횟수 안내(가능하면) · 비밀번호는 서버에서만 검증 · 클라이언트에 hash 미노출
5. [ ] **문서** — 이 항목 완료 체크 · QA에 비회원 CS 시나리오 추가

**완료 기준 (Acceptance)**
- [ ] 비회원 배송중/배송완료 주문 → order-inquiry 조회 → 반품 요청 접수됨
- [ ] 관리자 주문 상세에 해당 CS가 보이고 승인→검수→완료 가능
- [ ] 교환 요청 시 hold RPC가 회원과 동일하게 동작
- [ ] 잘못된 비밀번호로는 CS 요청 불가
- [ ] 이미 open CS가 있으면 409/안내

---

### 그다음 (P0 이후)

1. [ ] **P0.1** 비회원 배송 전 셀프 취소 (order-inquiry, 선택)
2. [ ] QA (회원+비회원 CS · 교환 hold · 수기 재고 · 웹훅)  
3. [x] 비회원 `/order-inquiry`에 CS·송장·취소 이력 표시  
4. [x] 교환 시 사이즈별 재고 hold (차액은 사이즈별 가격 도입 후)  
5. [x] 상품 등록·재고 화면 Cafe24형 정리 (신규 절대값 / 수정 수기 조정)  
6. [x] 주문 목록 일괄 상태 변경 · `order_status_histories` 타임라인 UI  
7. [x] 토스 Webhook · 부분환불 UI 개선 (라이브 키 전환은 심사 후)  
8. [ ] 심사 통과 후 라이브 키 전환 + 라이브 웹훅 등록  
9. [ ] 교환 차액 정산 (사이즈별 가격 도입 후)

---

## 4) QA 체크리스트 (짧게)

- [ ] 회원 배송중/완료 주문 → 반품·교환·환불 요청 가능
- [ ] **비회원** order-inquiry → 반품·교환·환불 요청 가능 (P0 완료 후)
- [ ] 관리자 주문 상세에서 CS 승인→검수→완료, 환불 시 주문 `refunded`·재고 증가
- [ ] `/admin/products/.../edit` 하단 수기 조정 + / − 및 이력
- [ ] SQL 미실행 시 API가 `add_*.sql을 실행해주세요` 류 메시지 내는지 확인

---

## 5) 한 줄 요약 — 다른 PC에서 바로 할 일

1. **`git pull` 후 P0: 비회원 CS 요청** (order-inquiry 인증 → 반품/교환/환불 접수)  
2. 필요 SQL 확인 (`add_exchange_stock_hold.sql` 등)  
3. P0 완료 후 회원+비회원 CS QA · (심사 후) 라이브 키
