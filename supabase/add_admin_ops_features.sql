-- Admin 운영 기능 (회원·THINK 신고/숨김·매거진)
-- Supabase SQL Editor에서 실행하세요

-- ========== 1) 회원: 차단 ==========
alter table public.profiles
  add column if not exists is_blocked boolean not null default false;

alter table public.profiles
  add column if not exists blocked_at timestamptz;

alter table public.profiles
  add column if not exists blocked_reason text;

comment on column public.profiles.is_blocked is '관리자 차단 여부 — 로그인·글쓰기 제한';
comment on column public.profiles.blocked_at is '차단 시각';
comment on column public.profiles.blocked_reason is '차단 사유';

-- ========== 2) THINK: 숨김 ==========
alter table public.think_posts
  add column if not exists is_hidden boolean not null default false;

alter table public.think_posts
  add column if not exists hidden_at timestamptz;

alter table public.think_posts
  add column if not exists hidden_reason text;

create index if not exists think_posts_hidden_idx
  on public.think_posts (is_hidden, created_at desc);

comment on column public.think_posts.is_hidden is '관리자 숨김 — 공개 목록·상세 비노출';

-- ========== 3) THINK: 신고 ==========
create table if not exists public.think_post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.think_posts(id) on delete cascade,
  reporter_user_id uuid references auth.users(id) on delete set null,
  reporter_ip text not null default '',
  reason text not null default '',
  status text not null default 'open'
    check (status in ('open', 'reviewed', 'dismissed', 'actioned')),
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists think_post_reports_post_id_idx
  on public.think_post_reports (post_id, created_at desc);

create index if not exists think_post_reports_status_idx
  on public.think_post_reports (status, created_at desc);

alter table public.think_post_reports enable row level security;

drop policy if exists "think_post_reports: 관리자 읽기" on public.think_post_reports;
create policy "think_post_reports: 관리자 읽기"
  on public.think_post_reports for select
  using (public.is_admin());

drop policy if exists "think_post_reports: 관리자 수정" on public.think_post_reports;
create policy "think_post_reports: 관리자 수정"
  on public.think_post_reports for update
  using (public.is_admin());

-- insert는 API(service role)로 처리

-- ========== 4) 매거진 ==========
create table if not exists public.magazine_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text,
  excerpt text not null default '',
  content_html text not null default '',
  cover_url text,
  category text not null default 'culture'
    check (category in ('culture', 'news')),
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'published', 'archived')),
  show_on_music boolean not null default false,
  published_at timestamptz,
  scheduled_at timestamptz,
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists magazine_posts_status_idx
  on public.magazine_posts (status, published_at desc nulls last);

create index if not exists magazine_posts_category_idx
  on public.magazine_posts (category, status, published_at desc nulls last);

create index if not exists magazine_posts_music_idx
  on public.magazine_posts (show_on_music, status)
  where show_on_music = true;

alter table public.magazine_posts enable row level security;

drop policy if exists "magazine_posts: 공개 읽기" on public.magazine_posts;
create policy "magazine_posts: 공개 읽기"
  on public.magazine_posts for select
  using (
    status = 'published'
    and (published_at is null or published_at <= now())
  );

drop policy if exists "magazine_posts: 관리자 전체" on public.magazine_posts;
create policy "magazine_posts: 관리자 전체"
  on public.magazine_posts for all
  using (public.is_admin())
  with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit)
values ('magazine', 'magazine', true, 52428800)
on conflict (id) do update set public = true, file_size_limit = 52428800;

drop policy if exists "magazine: 전체 읽기" on storage.objects;
create policy "magazine: 전체 읽기" on storage.objects
  for select using (bucket_id = 'magazine');

drop policy if exists "magazine: 관리자 업로드" on storage.objects;
create policy "magazine: 관리자 업로드" on storage.objects
  for insert with check (bucket_id = 'magazine' and public.is_admin());

drop policy if exists "magazine: 관리자 삭제" on storage.objects;
create policy "magazine: 관리자 삭제" on storage.objects
  for delete using (bucket_id = 'magazine' and public.is_admin());
