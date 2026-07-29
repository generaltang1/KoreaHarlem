# KoreaHarlem

종합 예술 사이트 — Next.js + Supabase + Vercel

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router, React 19) |
| 스타일 | Tailwind CSS 4 |
| 데이터베이스 / Auth | Supabase |
| 배포 | Vercel |

## 시작하기

### 1. Node.js 설치

[Node.js LTS](https://nodejs.org/) (v20 이상 권장)를 설치한 뒤 터미널을 재시작하세요.

### 2. 의존성 설치

```bash
npm install
```

### 3. Supabase 프로젝트 생성

1. [Supabase Dashboard](https://supabase.com/dashboard)에서 새 프로젝트 생성
2. **Project Settings → API** 에서 아래 값 확인:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. 환경 변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local` 파일에 Supabase 값을 입력합니다.

### 5. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인

## Supabase 연동 구조

```
src/lib/supabase/
├── client.ts      # 브라우저(Client Component)용
├── server.ts      # Server Component / Route Handler용
└── middleware.ts  # 세션 갱신 로직

src/middleware.ts  # 모든 요청에서 Supabase 세션 유지
```

## Vercel 배포

1. GitHub에 저장소 푸시
2. [Vercel](https://vercel.com)에서 Import
3. **Environment Variables**에 아래 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

> Supabase Dashboard → **Authentication → URL Configuration** 에서
> Vercel 배포 URL을 Site URL / Redirect URLs에 등록하세요.

## 다음 단계

- [ ] Supabase DB 스키마 설계 (작품, 아티스트, 이벤트 등)
- [ ] 인증 (로그인/회원가입)
- [ ] Vercel ↔ Supabase 연동 확인
