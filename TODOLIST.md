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
| 배송 후 반품·교환·환불 | 요청→승인/검수→완료 | 구매자 요청 → 관리자 |
| 예외(수동 송금 등) | — | 관리자 + **수기 재고** |

재고: 주문 시 차감 · 결제실패/배송전취소 복구 · 반품은 **검수 후 처리완료 시** 복구 · 실재고 불일치는 수기 조정

---

## 2) 구현 완료 (코드 기준)

> CS·수기조정 포함해 `main` 배포. 최신 커밋은 `git log -1`으로 확인.

### 주문·결제·회원
- [x] 주문서 + 토스 · 비회원 `/order-inquiry` · 재고 예약/복구
- [x] `/mypage/orders` 목록·필터·상세 · 배송 전 셀프 취소 (`POST /api/orders/[id]/cancel`)
- [x] 관리자 배송: 준비중 / 송장·배송중 / 배송완료 (`POST /api/admin/orders/[id]/shipping`)

### 반품·교환·환불 CS
- [x] DB: `order_cs_requests`, `order_status_histories`
- [x] 구매자: `/mypage/orders/[id]` — `OrderCsRequestForm` (`POST /api/orders/[id]/cs-request`)
- [x] 관리자: 주문 상세 `AdminCsPanel` — 승인/반려/회수·검수/처리완료  
  (`POST /api/admin/orders/[id]/cs/[requestId]`, 완료 시 토스 환불·재고 복구 옵션)
- [x] 헬퍼: `src/lib/csRequests.ts`, 주문 상태 확장: `src/lib/orders.ts`
- [x] 교환 사이즈 재고 hold (`add_exchange_stock_hold.sql`) — 승인 hold · 반려 해제 · 완료 시 원사이즈 복구/`order_items` 갱신
- [ ] 교환 차액 정산 — 사이즈별 가격 도입 후 (현재 `price_krw` 공통)
- [x] 비회원 주문조회에 CS·송장·취소 이력 표시

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
| 관리자 CS | `src/components/admin/AdminCsPanel.tsx` |
| 수기 조정 UI | `src/components/admin/StockAdjustPanel.tsx` |
| 주문 상태/라벨 | `src/lib/orders.ts` |
| 관리자 API 가드 | `src/lib/adminApi.ts` (`assertAdminApi`) |
| 서비스롤 클라이언트 | `src/lib/supabase/admin.ts` (`createServiceClient`) |

---

## 3) 다음 작업 (우선순위)

1. [x] 커밋·푸시·Vercel 배포 (CS + 수기조정)
2. [ ] QA  
   - 반품: 요청 → 승인 → 검수 → 처리완료(토스·재고)  
   - 수기 조정: ± · 음수 방지 · 이력  
3. [x] 비회원 `/order-inquiry`에 CS·송장·취소 이력 표시  
4. [x] 교환 시 사이즈별 재고 hold (차액은 사이즈별 가격 도입 후)  
5. [x] 상품 등록·재고 화면 Cafe24형 정리 (신규 절대값 / 수정 수기 조정)  
6. [x] 주문 목록 일괄 상태 변경 · `order_status_histories` 타임라인 UI  
7. [x] 토스 Webhook · 부분환불 UI 개선 (라이브 키 전환은 심사 후)  

---

## 4) QA 체크리스트 (짧게)

- [ ] 회원 배송중/완료 주문 → 반품·교환·환불 요청 가능
- [ ] 관리자 주문 상세에서 CS 승인→검수→완료, 환불 시 주문 `refunded`·재고 증가
- [ ] `/admin/products/.../edit` 하단 수기 조정 + / − 및 이력
- [ ] SQL 미실행 시 API가 `add_*.sql을 실행해주세요` 류 메시지 내는지 확인

---

## 5) 한 줄 요약 — 다른 PC에서 바로 할 일

1. `git pull` 후 필요 SQL 실행 (`add_exchange_stock_hold.sql` 등)  
2. Vercel 배포 후 토스 웹훅 URL이 동작하는지 확인 (GET으로 ok 응답)  
3. 심사 통과 후 **라이브 키 전환** + 라이브 웹훅 등록  
4. SHOP 기능 완료 후 한 사이클 QA (주문·결제·CS·재고)
