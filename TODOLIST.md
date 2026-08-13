# TODO LIST — KoreaHarlem

다른 PC에서 이어 작업할 때 **이 파일을 먼저** 읽으세요.  
기준: Cafe24형 일반 몰 · KoreaHarlem 브랜드 UI · 토스페이먼츠 심사 대비

프로덕션: https://korea-harlem.vercel.app  
스택: Next.js 15 + Supabase + Vercel + Toss Payments

> **2026-08-13 (최신):** 진열/판매 상태 · 장바구니 구매불가 UX · Footer **이용안내** 반영. `git log -1` · Vercel 배포 확인.

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
| `add_exchange_stock_hold.sql` | 교환 hold RPC | **실행 여부 확인** |
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
| **1** | **메뉴 정리 (IA/네비) + 상품 카테고리** | **코드 완료** · Admin 메뉴 분류·기존 상품 카테고리 지정 잔여 |
| **2** | **이용안내 · 환불정책 (토스 심사)** | **부분 완료** — Footer·`/guide`·결제 링크 · 토스 체크리스트 점검 잔여 |
| **3** | **진열/판매 상태 + 장바구니 UX** | **완료** · 배포됨 |
| 4+ | 커머스 CS 잔여 · 백로그 · QA | 대기 |

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

**진열/판매 상태 (Cafe24형 · 2026-08-13)**
| 필드 | Admin UI | 공개 동작 |
|------|----------|-----------|
| `is_published` | 진열함 / 진열안함 | 진열안함 → In Store·상세 비노출 |
| `is_sale` | 판매함 / 판매안함 | 판매안함 → 노출만, 구매·장바구니·결제 불가 (티켓·프리오더) |

**주요 파일**
| 구분 | 경로 |
|------|------|
| nav 정의 | `src/data/navigation.ts` |
| 헤더 드롭다운 | `src/components/layout/NavMenu.tsx` |
| 카테고리 상수 | `src/lib/productCategories.ts` |
| 진열/판매 폼 | `src/components/admin/ProductForm.tsx` |
| In Store 필터 | `src/app/sale/page.tsx` · `src/lib/productSearch.ts` |
| 장바구니 상태 검증 | `src/lib/cartAvailability.ts` · `src/hooks/useCartProductAvailability.ts` |
| 이용안내 | `src/data/usageGuide.ts` · `src/app/guide/page.tsx` · `UsageGuideModal` |

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
- [ ] **기존 상품 카테고리 일괄 지정** (Admin에서 수동)
- [ ] **Admin 메뉴 분류** (다음 단계)
- [x] 커밋 · 푸시 · Vercel 배포 (메뉴 IA·카테고리)

#### 2순위 — 이용안내 · 환불정책 (토스 심사)
- [x] Footer **이용안내** 모달 (결제·배송·교환/반품·**환불안내**)
- [x] 전용 페이지 `/guide` · `#shipping` · `#refund` 앵커
- [x] 결제 페이지 약관 동의 → **이용안내**·**환불정책** 링크
- [ ] 이용약관 본문과 **환불/청약철회** 문구 정합성 검토 (필요 시 TermsModal 보강)
- [ ] 토스페이먼츠 **심사 체크리스트** 전체 점검

#### 3순위 — 진열/판매 + 장바구니 (2026-08-13 · 로컬)
- [x] Admin **표시 설정**: 진열상태 · 판매상태 (라디오)
- [x] In Store: `is_published`만 필터 (판매안함도 목록·상세 노출)
- [x] 상품 상세: 판매안함 → 구매/장바구니 비활성 + 안내 문구
- [x] 주문 API: 진열안함·판매안함 상품 주문 차단
- [x] 장바구니·결제: 구매 불가 상품 **회색 + 뱃지** · 결제 시 **alert** 차단
- [x] 커밋 · 푸시 · Vercel 배포

---

### 계정 · 인증
1. [ ] **아이디/비밀번호 찾기** — Supabase reset / OAuth 정책

### 음악 플레이어
3. [ ] 앨범 종료 후 **전 아티스트 앨범 랜덤 연속 재생**
4. [ ] **셔플** (하단 재생바 on/off)
6. [ ] 앨범 상세 **우측 다른 앨범 추천**

### 음악 커뮤니티 · 판매
5. [ ] 앨범 **댓글/평가** (커뮤니티)
9. [ ] **음원/앨범 유료 판매 + mp3/wav 다운로드**

### 콘텐츠 · CMS
7. [ ] 상품·앨범 **예약 업로드 + 임시저장**
8. [ ] 아티스트 **프로필 사진 여러 장** + 대표 설정·갤러리
10. [ ] **한정판매** 체크 + 잔여 수량 강조

---

## 3) 기존 커머스 · CS (완료 / 잔여)

### 완료
- [x] 주문·토스·비회원 조회·재고
- [x] 회원 주문·셀프 취소·관리자 배송/송장
- [x] 회원 CS · 교환 hold · 수기 재고 · Cafe24형 재고 UX
- [x] 비회원 조회 CS·송장 이력 · 일괄 상태 · 타임라인 · 웹훅 · 부분환불 UI
- [x] Cafe24형 **진열/판매 상태** · 장바구니 구매불가 UX

### 잔여
- [ ] 비회원 CS **요청** (order-inquiry)
- [ ] 비회원 배송 전 취소 (선택)
- [ ] 교환 차액 (사이즈별 가격 후)
- [ ] 라이브 키 + 라이브 웹훅 (심사 후)
- [ ] CS / hold / 수기재고 / **진열·판매·장바구니** QA

---

## 4) QA (짧게)

- [ ] In Store: Shop All / Merch / CD / Ticket 필터·상품 노출
- [ ] Admin: 기존 상품 카테고리 저장 후 해당 메뉴에 표시
- [ ] Admin: 진열안함 / 판매안함 저장 → 목록·상세·장바구니·결제 동작
- [ ] 장바구니 담은 뒤 Admin에서 상태 변경 → **구매 불가** 표시·결제 alert
- [ ] Footer **이용안내** · `/guide` · 결제 페이지 환불 링크
- [ ] Music → Artists → Album → 재생
- [ ] Think / Magazine Coming Soon

---

## 5) 한 줄 요약 — 지금 할 일

1. Admin **기존 상품 카테고리 지정** + QA (진열·판매·이용안내 포함)  
2. **Admin 메뉴 분류** 또는 **토스 심사 체크리스트** 마무리  
3. 그다음: 비회원 CS 요청 · 아이디/비번 찾기 · 플레이어 · CMS
