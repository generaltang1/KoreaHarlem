# TODO LIST (주문/결제/주문관리)

기준: Cafe24형 일반 몰 프로세스 · KoreaHarlem 브랜드 UI 유지

## 운영 정책 (확정)

결제·일부 취소는 시스템에 가깝게 자동, **배송·CS 단계는 운영자가 상태를 관리**.

| 단계 | 상태 | 누가 |
|------|------|------|
| 주문 생성 | `pending` | 시스템 |
| 결제 성공 | `paid` | 시스템(토스) |
| 출고 준비 | `preparing` | 관리자 |
| 송장/배송중 | `shipped` | 관리자 |
| 배송완료 | `delivered` | 관리자 |
| 배송 전 취소 | `cancelled` / `refunded` | 구매자·관리자 (+토스 환불) |
| 배송 후 반품·교환 | 요청 → 승인/검수 | 구매자 요청 → 관리자 |
| 예외 환불 | 수동 송금 등 | 관리자 + 수기 재고 |

재고: 주문 시 차감 · 결제실패/배송전취소 복구 · 반품은 **검수 완료 시** 복구 권장 · 실재고 불일치는 수기 조정

---

## 1) 구현 완료 (이번까지)

### 주문·결제
- [x] 주문서(배송지·카카오주소·상품·결제수단·약관) + 토스 결제
- [x] 비회원 주문번호·조회 비밀번호 + `/order-inquiry`
- [x] 주문완료 상세
- [x] 재고 선검증·예약차감·결제실패 복구·사이즈별 재고

### 회원·관리자
- [x] `/mypage` · `/mypage/orders` · `/mypage/orders/[id]` (목록·필터·상세·송장 표시)
- [x] 배송 전 셀프 취소 (`POST /api/orders/[id]/cancel` + UI)
- [x] 관리자 주문 목록/상세 · 결제대기 취소 · 토스 환불
- [x] 관리자 배송 처리: 준비중 / 송장·배송중 / 배송완료 (`add_order_shipping.sql`)

### SQL (실행 여부 확인)
- [x] `add_guest_orders.sql` / `add_product_size_stock.sql` / `add_order_refunds.sql`
- [x] `alter_restore_stock_preparing.sql`
- [x] `add_order_shipping.sql` (사용자 실행 예정·또는 완료)

---

## 2) 다음 작업 (우선순위)

### ▶ 바로 다음: 반품 / 교환 / 환불 요청
1. **DB**
   - [ ] `order_return_requests` / `order_exchange_requests` / `order_refund_requests` (또는 통합 `order_cs_requests`)
   - [ ] 상태: `return_requested` → `return_received` → `return_completed` 등
   - [ ] `order_status_histories` (변경자·사유·시각)
2. **구매자 UI** (`/mypage/orders/[id]`)
   - [ ] 배송중·배송완료에서 **반품 요청** / **교환 요청** / (필요 시) **환불 요청**
   - [ ] 사유 입력 · 요청 후 대기 상태 표시
3. **관리자 UI** (`/admin/orders/[id]` 또는 요청 목록)
   - [ ] 요청 승인 / 반려
   - [ ] 반품: 회수·검수 완료 → **토스 환불** + **재고 복구**(검수 시점)
   - [ ] 교환: 승인 → 재고 hold · (차액은 이후)

### 이어서
4. [ ] 관리자 **재고 수기 조정**(±수량·사유·이력) + 수동환불 후 재고 복구 버튼  
5. [ ] 비회원 주문조회에 취소/환불/송장 이력 표시  
6. [ ] 상품 등록/재고 화면 Cafe24형으로 정리·보강  
7. [ ] 주문 목록 상태 일괄 변경 · 처리 이력 타임라인  
8. [ ] 토스 Webhook · 부분환불 정책 UI · 라이브 키 전환 체크  

---

## 3) 배포 / 환경 체크

- [ ] Vercel에 `SUPABASE_SERVICE_ROLE_KEY`, `TOSS_*` 키 설정 확인
- [ ] 테스트 키 → 실결제 시 라이브 키 교체
- [ ] QA: 회원 주문내역 · 셀프취소 · 관리자 송장/배송완료 · (추가 후) 반품 요청 플로우

---

## 4) 한 줄 요약 — 다음에 할 일

**배송 후 CS: 반품·교환·환불 요청(구매자) + 관리자 승인/검수/토스환불/재고복구**부터 구현.
