-- E 심화: Supported by
-- Supabase SQL Editor에서 실행
-- ※ 「포함된 플레이리스트」는 미사용 · 테이블이 이미 있으면 아래 drop 으로 정리

drop policy if exists "album_playlist_entries: public read" on public.album_playlist_entries;
drop table if exists public.album_playlist_entries;

-- Supported by (구매 공개 닉네임 · Admin 수동 등록 포함)
create table if not exists public.album_supporters (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null,
  comment text,
  is_public boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint album_supporters_comment_len check (comment is null or char_length(comment) <= 200),
  constraint album_supporters_name_len check (char_length(trim(display_name)) between 1 and 40)
);

create index if not exists album_supporters_album_public_idx
  on public.album_supporters (album_id, is_public, sort_order, created_at desc);

comment on table public.album_supporters is
  '앨범 Supported by 공개 닉네임·한 줄 코멘트 (E-04 / E-09)';

alter table public.album_supporters enable row level security;

drop policy if exists "album_supporters: public read" on public.album_supporters;
create policy "album_supporters: public read"
  on public.album_supporters for select
  using (is_public = true);

-- 쓰기는 서비스 롤 / Admin API 경유
