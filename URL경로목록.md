# KoreaHarlem URL 경로 목록

**기준:** `src/app/**/page.tsx` · `route.ts` (2026-11-27)  
**정리:** 시안 A~N 라벨로만 **묶음** — 경로는 **코드 실제 라우트** (시안 URL이 아님).

관련 문서: [`디자인작업완료.md`](./디자인작업완료.md) (핸드오프·잔여) · [`전체시안분석.md`](./전체시안분석.md)

> **2026-11-27:** `/admin/music/supporters` (E-09) 추가. 「포함된 플레이리스트」전용 공개 URL은 없음(기능 제외).

---

## A · 메인 탐색

| 경로 | 비고 |
|------|------|
| `/` | 홈 (A-01 PC · A-02 모바일) |

---

## B · SHOP 암시장

| 경로 | 비고 |
|------|------|
| `/sale` | 목록 · 쿼리 `?category=` `?sub=` `?q=` `?page=` `?size=` |
| `/sale/[id]` | 상품·티켓 PDP |
| `/cart` | 장바구니 |

---

## C · Magazine 떠돌이말

| 경로 | 비고 |
|------|------|
| `/magazine` | 메인 |
| `/magazine/all` | 전체 기사 |
| `/magazine/culture` | Culture |
| `/magazine/news` | News |
| `/magazine/[slug]` | 기사 상세 |

---

## D · THINK

| 경로 | 비고 |
|------|------|
| `/think` | 피드 · 쿼리 `?tab=` `?sort=` `?flair=` `?q=` `?page=` |
| `/think/new` | 글쓰기 |
| `/think/[id]` | 상세 |
| `/think/[id]/edit` | 수정 (로그인·본인/관리자) |
| `/mypage/think` | 내 THINK (로그인) |

---

## E · Music 셀렉츠

| 경로 | 비고 |
|------|------|
| `/music` | 뮤직 홈 |
| `/music/albums` | 앨범 아카이브 |
| `/music/album/[id]` | 앨범 상세 |
| `/music/dj-set` | DJ SET |
| `/artists` | 아티스트 목록 |
| `/artists/[id]` | 아티스트 상세 |
| `/mypage/music` | My Music (로그인) |
| `/music/[id]` | → `/music/album/[id]` 또는 `/artists` **리다이렉트** |
| `/works` | 레거시 작품/앨범 목록 · 쿼리 `?category=` `?q=` `?page=` `?size=` |

---

## F · 커머스·주문·마이페이지

| 경로 | 비고 |
|------|------|
| `/checkout` | 결제 |
| `/checkout/auth` | 결제 전 인증 |
| `/checkout/success` | 결제 성공 |
| `/checkout/fail` | 결제 실패 |
| `/mypage` | 마이페이지 홈 (로그인) |
| `/mypage/orders` | 주문 목록 |
| `/mypage/orders/[id]` | 주문 상세 |
| `/mypage/orders/[id]/claim` | 교환·반품 클레임 |
| `/mypage/profile` | 내 정보 변경 |
| `/mypage/wishlist` | 위시리스트 |
| `/order-inquiry` | 비회원 주문조회 |

---

## G · 계정·안내

| 경로 | 비고 |
|------|------|
| `/login` | 로그인 · 쿼리 `?next=` |
| `/signup` | 회원가입 |
| `/signup/complete` | 가입 완료 |
| `/find-id` | 아이디 찾기 |
| `/forgot-password` | 비밀번호 찾기 |
| `/auth/reset-password` | 비밀번호 재설정 |
| `/guide` | 이용안내 |
| `/contact` | 고객센터 (앵커 `#faq`) |
| `/about` | 소개 |
| `/faq` | → `/contact#faq` **리다이렉트** |

---

## H · Admin

| 경로 | 비고 |
|------|------|
| `/admin` | → `/admin/dashboard` **리다이렉트** |
| `/admin/dashboard` | 대시보드 |
| `/admin/artists` | 아티스트 목록 |
| `/admin/artists/new` | 아티스트 등록 |
| `/admin/artists/[id]/edit` | 아티스트 수정 |
| `/admin/artists/dashboard` | 아티스트 음원 대시보드 |
| `/admin/music` | 음반 목록 |
| `/admin/music/new` | 음반 등록 |
| `/admin/music/[id]/edit` | 음반 수정 |
| `/admin/music/supporters` | Supported by (E-09) |
| `/admin/dj-set` | DJ SET 설정 |
| `/admin/products` | 상품 목록 |
| `/admin/products/new` | 상품 등록 |
| `/admin/products/[id]/edit` | 상품 수정 |
| `/admin/orders` | 주문 목록 |
| `/admin/orders/[id]` | 주문 상세 |
| `/admin/orders/pending` | 결제대기 등 |
| `/admin/orders/preparing` | 배송준비 |
| `/admin/orders/ready` | 배송준비중(ready) |
| `/admin/orders/shipped` | 배송중 |
| `/admin/orders/delivered` | 배송완료 |
| `/admin/orders/claims` | 클레임 |
| `/admin/members` | 회원 |
| `/admin/think` | THINK 모더레이션 |
| `/admin/magazine` | 매거진 목록 |
| `/admin/magazine/new` | 매거진 글쓰기 |
| `/admin/magazine/[id]/edit` | 매거진 수정 |
| `/admin/tips` | 제보 목록 |
| `/admin/tips/[id]` | 제보 상세 |
| `/admin/events/new` | 이벤트 등록 (레거시/보조) |

---

## I · 오버레이

전용 **페이지 URL이 거의 없음** (카트 드로어·퀵뷰·제보 모달·하단 MusicPlayer·에러 토스트 등 전역 UI).

| 관련 경로 | 비고 |
|-----------|------|
| `/cart` | 장바구니 페이지 (B와 공유) |
| `/checkout/fail` | 결제 실패 화면 (F와 공유) |
| — | I-06 모바일 풀스크린 플레이어 → **별도 URL 없음** |

---

## J · 리포트 / K · 디자인 시스템 / L · 웹 화이트 / M · 모바일 앱 / N · 보관

| 섹션 | 페이지 URL |
|------|------------|
| **J** 리포트 | 없음 (문서·분석용) |
| **K** 디자인 시스템 | 없음 (토큰·컴포넌트 참조) |
| **L** 웹 화이트 | 없음 — 동일 공개 URL의 화이트 테마 변형 |
| **M** 모바일 앱 | 없음 — 동일 기능의 앱/모바일 프레임 (네이티브 전용 경로 아님) |
| **N** 기타·구버전 | 없음 (보관) |

---

## 인증 콜백 (페이지 아님 · Route Handler)

| 경로 | 비고 |
|------|------|
| `/auth/callback` | OAuth/세션 콜백 |
| `/auth/confirm` | 이메일 확인 링크 |

---

## API (`/api/...`)

화면 매핑용이 아니라 백엔드 엔드포인트. `[id]` 등은 동적 세그먼트.

### 공개·회원

| 경로 |
|------|
| `/api/auth/find-account` |
| `/api/exchange-rates` |
| `/api/dj-set/settings` |
| `/api/dj-set/tracks` |
| `/api/magazine/[slug]/view` |
| `/api/music/download` |
| `/api/music/download-zip` |
| `/api/music/durations` |
| `/api/music/random-queue` |
| `/api/music/tracks/[id]/play` |
| `/api/music/tracks/[id]/download` |
| `/api/mypage/profile` |
| `/api/orders/create` |
| `/api/orders/lookup` |
| `/api/orders/release-stock` |
| `/api/orders/[id]/cancel` |
| `/api/orders/[id]/guest-cancel` |
| `/api/orders/[id]/cs-request` |
| `/api/orders/[id]/cs-request/[requestId]/attachments` |
| `/api/orders/[id]/guest-cs-request` |
| `/api/payments/toss/confirm` |
| `/api/payments/toss/webhook` |
| `/api/products/[id]/qna` |
| `/api/products/[id]/reviews` |
| `/api/think/posts` |
| `/api/think/posts/[id]` |
| `/api/think/posts/[id]/comments` |
| `/api/think/posts/[id]/recommend` |
| `/api/think/posts/[id]/report` |
| `/api/think/posts/[id]/complete` |
| `/api/think/posts/[id]/abort` |
| `/api/think/youtube/search` |
| `/api/tips` |
| `/api/tips/[id]/complete` |
| `/api/tips/[id]/abort` |

### Admin API

| 경로 |
|------|
| `/api/admin/dj-set/settings` |
| `/api/admin/music/albums/[id]/supporters` | Supported by (E-09) |
| `/api/admin/magazine` |
| `/api/admin/magazine/[id]` |
| `/api/admin/members` |
| `/api/admin/members/[id]` |
| `/api/admin/orders/bulk-status` |
| `/api/admin/orders/[id]` |
| `/api/admin/orders/[id]/cancel` |
| `/api/admin/orders/[id]/refund` |
| `/api/admin/orders/[id]/shipping` |
| `/api/admin/orders/[id]/cs/[requestId]` |
| `/api/admin/products/[id]/stock-adjust` |
| `/api/admin/think/reports` |
| `/api/admin/think/posts/[id]/moderation` |
| `/api/admin/tips` |
| `/api/admin/tips/[id]` |

---

## 요약

| 구분 | 개수(대략) |
|------|------------|
| 페이지 (`page.tsx`) | ~70 (리다이렉트 포함) |
| 인증 콜백 | 2 |
| API | ~50 |
| L/M/K/J/N 전용 URL | 0 |

**시안 모듈에 없거나 레거시로 남는 코드 경로:** `/works` · `/music/[id]`(리다이렉트) · `/admin/events/new` · `/admin/tips` · `/order-inquiry`

---

*경로 추가·삭제 시 이 문서를 갱신한다.*
