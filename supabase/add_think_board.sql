-- THINK 게시판 (DC인사이드 스타일)
-- Supabase SQL Editor에서 실행하세요

create table if not exists think_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content_html text not null default '',
  user_id uuid references auth.users(id) on delete set null,
  author_nickname text not null,
  author_ip text not null,
  is_notice boolean not null default false,
  recommend_count integer not null default 0,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists think_posts_created_at_idx on think_posts (created_at desc);
create index if not exists think_posts_notice_idx on think_posts (is_notice, created_at desc);
create index if not exists think_posts_recommend_idx on think_posts (recommend_count desc, created_at desc);

create table if not exists think_post_attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references think_posts(id) on delete cascade,
  file_url text not null,
  file_name text,
  mime_type text,
  kind text not null default 'other'
    check (kind in ('image', 'video', 'other')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists think_post_attachments_post_id_idx on think_post_attachments (post_id);

create table if not exists think_post_youtube (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references think_posts(id) on delete cascade,
  video_id text not null,
  title text,
  channel_title text,
  thumbnail_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists think_post_youtube_post_id_idx on think_post_youtube (post_id);

create table if not exists think_post_recommends (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references think_posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  voter_ip text not null,
  created_at timestamptz not null default now(),
  unique (post_id, voter_ip)
);

create index if not exists think_post_recommends_post_id_idx on think_post_recommends (post_id);

alter table think_posts enable row level security;
alter table think_post_attachments enable row level security;
alter table think_post_youtube enable row level security;
alter table think_post_recommends enable row level security;

-- 공개 읽기 (목록·상세는 API service role 또는 select 정책)
create policy "think_posts: 전체 읽기"
  on think_posts for select
  using (true);

create policy "think_post_attachments: 전체 읽기"
  on think_post_attachments for select
  using (true);

create policy "think_post_youtube: 전체 읽기"
  on think_post_youtube for select
  using (true);

create policy "think_posts: 관리자 삭제"
  on think_posts for delete
  using (public.is_admin());

create policy "think_posts: 관리자 수정"
  on think_posts for update
  using (public.is_admin());

-- insert/update는 API(service role)로 처리

-- Storage: think 버킷 (이미지 20MB · 동영상 100MB — API에서 검증)
insert into storage.buckets (id, name, public, file_size_limit)
values ('think', 'think', true, 104857600)
on conflict (id) do update set public = true, file_size_limit = 104857600;

drop policy if exists "think: 전체 읽기" on storage.objects;
drop policy if exists "think: 관리자 삭제" on storage.objects;

create policy "think: 전체 읽기" on storage.objects
  for select using (bucket_id = 'think');

create policy "think: 관리자 삭제" on storage.objects
  for delete using (bucket_id = 'think' and public.is_admin());
