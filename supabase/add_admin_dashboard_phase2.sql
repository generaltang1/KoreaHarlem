-- Admin 대시보드·등록·집계 Phase2
-- Supabase SQL Editor에서 이 파일 전체를 한 번에 실행하세요.
-- (add_admin_ops_features.sql 실행 이후)

-- ========== 1) Admin 감사 로그 ==========
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text not null default '',
  actor_nickname text not null default '',
  module text not null default '',
  action text not null default '',
  target_type text not null default '',
  target_id text,
  summary text not null default '',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_idx
  on public.admin_audit_logs (created_at desc);

create index if not exists admin_audit_logs_module_idx
  on public.admin_audit_logs (module, created_at desc);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "admin_audit_logs: 관리자 읽기" on public.admin_audit_logs;
create policy "admin_audit_logs: 관리자 읽기"
  on public.admin_audit_logs for select
  using (public.is_admin());

-- insert는 service role API로 처리

-- ========== 2) 아티스트 확장 (H-03) ==========
alter table public.artists add column if not exists name_en text;
alter table public.artists add column if not exists genre text;
alter table public.artists add column if not exists activity_type text
  check (activity_type is null or activity_type in ('solo', 'group'));
alter table public.artists add column if not exists debut_date date;
alter table public.artists add column if not exists agency text;
alter table public.artists add column if not exists instagram_url text;
alter table public.artists add column if not exists youtube_url text;
alter table public.artists add column if not exists website_url text;
alter table public.artists add column if not exists manager_email text;
alter table public.artists add column if not exists is_public boolean not null default true;
alter table public.artists add column if not exists is_draft boolean not null default false;

comment on column public.artists.name_en is '영문 아티스트명 — H-02 목록 보조 텍스트';
comment on column public.artists.genre is '대표 장르 — H-02 카테고리';

-- ========== 3) 앨범/트랙: 예약공개·유형·재생/다운로드 ==========
alter table public.albums add column if not exists album_type text
  check (album_type is null or album_type in ('single', 'ep', 'album', 'mix', 'playlist'));
alter table public.albums add column if not exists release_date date;
alter table public.albums add column if not exists is_published boolean not null default true;
alter table public.albums add column if not exists scheduled_publish_at timestamptz;
alter table public.albums add column if not exists play_count bigint not null default 0;
alter table public.albums add column if not exists download_count bigint not null default 0;

alter table public.album_tracks add column if not exists play_count bigint not null default 0;
alter table public.album_tracks add column if not exists download_count bigint not null default 0;

create index if not exists albums_scheduled_publish_idx
  on public.albums (scheduled_publish_at)
  where scheduled_publish_at is not null and is_published = false;

-- ========== 4) 상품: 영문명 ==========
alter table public.products add column if not exists title_en text;

-- ========== 5) 상품 후기 · Q&A ==========
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author_nickname text not null default '',
  rating int not null default 5 check (rating between 1 and 5),
  body text not null default '',
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_reviews_product_idx
  on public.product_reviews (product_id, created_at desc);

alter table public.product_reviews enable row level security;

drop policy if exists "product_reviews: 공개 읽기" on public.product_reviews;
create policy "product_reviews: 공개 읽기"
  on public.product_reviews for select
  using (is_hidden = false or public.is_admin());

drop policy if exists "product_reviews: 로그인 작성" on public.product_reviews;
create policy "product_reviews: 로그인 작성"
  on public.product_reviews for insert
  with check (auth.uid() is not null);

drop policy if exists "product_reviews: 관리자 수정" on public.product_reviews;
create policy "product_reviews: 관리자 수정"
  on public.product_reviews for update
  using (public.is_admin());

drop policy if exists "product_reviews: 관리자 삭제" on public.product_reviews;
create policy "product_reviews: 관리자 삭제"
  on public.product_reviews for delete
  using (public.is_admin());

create table if not exists public.product_qna (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author_nickname text not null default '',
  question text not null default '',
  answer text,
  answered_by uuid references auth.users(id) on delete set null,
  answered_at timestamptz,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_qna_product_idx
  on public.product_qna (product_id, created_at desc);

alter table public.product_qna enable row level security;

drop policy if exists "product_qna: 공개 읽기" on public.product_qna;
create policy "product_qna: 공개 읽기"
  on public.product_qna for select
  using (is_hidden = false or public.is_admin());

drop policy if exists "product_qna: 로그인 작성" on public.product_qna;
create policy "product_qna: 로그인 작성"
  on public.product_qna for insert
  with check (auth.uid() is not null);

drop policy if exists "product_qna: 관리자 답변" on public.product_qna;
create policy "product_qna: 관리자 답변"
  on public.product_qna for update
  using (public.is_admin());

drop policy if exists "product_qna: 관리자 삭제" on public.product_qna;
create policy "product_qna: 관리자 삭제"
  on public.product_qna for delete
  using (public.is_admin());

-- ========== 6) 주문: 관리자 메모 ==========
alter table public.orders add column if not exists admin_memo text;

-- ========== 7) MUSIC 재생/다운로드 일별 집계 (대시보드용) ==========
create table if not exists public.music_daily_stats (
  day date not null,
  stream_count bigint not null default 0,
  download_count bigint not null default 0,
  primary key (day)
);

alter table public.music_daily_stats enable row level security;

drop policy if exists "music_daily_stats: 관리자 읽기" on public.music_daily_stats;
create policy "music_daily_stats: 관리자 읽기"
  on public.music_daily_stats for select
  using (public.is_admin());

-- ========== 8) DJ SET 라이브 설정 (단일 행) ==========
create table if not exists public.dj_set_settings (
  id int primary key default 1 check (id = 1),
  live_platform text not null default 'youtube',
  live_url text,
  live_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.dj_set_settings (id, live_platform, live_enabled)
values (1, 'youtube', false)
on conflict (id) do nothing;

alter table public.dj_set_settings enable row level security;

drop policy if exists "dj_set_settings: 공개 읽기" on public.dj_set_settings;
create policy "dj_set_settings: 공개 읽기"
  on public.dj_set_settings for select
  using (true);

drop policy if exists "dj_set_settings: 관리자 수정" on public.dj_set_settings;
create policy "dj_set_settings: 관리자 수정"
  on public.dj_set_settings for update
  using (public.is_admin())
  with check (public.is_admin());

-- ========== 9) 매거진 예약 자동 발행 보조 인덱스 ==========
create index if not exists magazine_posts_scheduled_idx
  on public.magazine_posts (scheduled_at)
  where status = 'scheduled';
