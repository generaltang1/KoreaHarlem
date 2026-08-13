# TODO LIST — KoreaHarlem

다른 PC에서 이어 작업할 때 **이 파일을 먼저** 읽으세요.  
기준: Cafe24형 일반 몰 · KoreaHarlem 브랜드 UI · 토스페이먼츠 심사 대비

프로덕션: https://korea-harlem.vercel.app  
스택: Next.js 15 + Supabase + Vercel + Toss Payments

> **2026-08-13:** 메뉴 IA·상품 카테고리 `main` 푸시·Vercel 배포. `git log -1`으로 확인.

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

### C. 환경 변수
`NEXT_PUBLIC_SUPABASE_*` · `SUPABASE_SERVICE_ROLE_KEY` · `TOSS_*` · 카카오 OAuth

---

## 1) 우선순위 로드맵 (2026-08 확정)

| 순위 | 항목 | 상태 |
|------|------|------|
| **1** | **메뉴 정리 (IA/네비) + 상품 카테고리** | **코드 완료** · Admin 메뉴 분류는 잔여 |
| **2** | **이용약관 환불정책** | 미구현 (토스 심사) |
| 3+ | 아래 백로그 · 커머스 잔여 · 커밋/배포 | 대기 |

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

**제거됨:** Explore · Sale · 아티스트 · 이벤트 (구 헤더)

**상품 카테고리 규칙**
- Admin 등록·수정: **In Store 카테고리 필수** (Merch → Tops/Bottoms/Accessory 필수)
- `category` null인 기존 상품 → **Shop All에만** 노출 · Admin에서 직접 지정
- DB 값: `merch`/`cd`/`ticket` + Merch만 `subcategory`

**주요 파일**
| 구분 | 경로 |
|------|------|
| nav 정의 | `src/data/navigation.ts` |
| 헤더 드롭다운 | `src/components/layout/NavMenu.tsx` |
| 카테고리 상수 | `src/lib/productCategories.ts` |
| SQL | `supabase/add_product_category.sql` |
| 상품 폼 | `src/components/admin/ProductForm.tsx` |
| 목록 필터 | `src/app/sale/page.tsx` · `src/lib/productSearch.ts` |

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
- [ ] **기존 상품 카테고리 일괄 지정** (Admin에서 수동)
- [ ] **Admin 메뉴 분류** (다음 단계)
- [x] 커밋 · 푸시 · Vercel 배포

#### 2순위 — 이용약관 · 환불정책 (토스 심사)
- [ ] 이용약관(또는 별도 환불/청약철회)에 **환불정책** 명시
- [ ] 결제/주문서 약관 동의 링크 연결 확인
- [ ] 토스페이먼츠 심사 체크리스트 점검

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

### 잔여
- [ ] 비회원 CS **요청** (order-inquiry)
- [ ] 비회원 배송 전 취소 (선택)
- [ ] 교환 차액 (사이즈별 가격 후)
- [ ] 라이브 키 + 라이브 웹훅 (심사 후)
- [ ] CS / hold / 수기재고 QA

---

## 4) QA (짧게)

- [ ] In Store: Shop All / Merch / CD / Ticket 필터·상품 노출
- [ ] Admin: 기존 상품 카테고리 저장 후 해당 메뉴에 표시
- [ ] Music → Artists → Album → 재생
- [ ] Think / Magazine Coming Soon
- [ ] (다음) 약관 환불정책 · 아이디/비번 찾기

---

## 5) 한 줄 요약 — 지금 할 일

1. Admin에서 **기존 상품 카테고리 지정** + 메뉴 QA  
2. **Admin 메뉴 분류** 또는 **환불약관**(2순위)  
3. 그다음: 아이디/비번 찾기 · 플레이어 · 댓글 · CMS · 음원판매
