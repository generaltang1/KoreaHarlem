-- =============================================
-- albums + album_tracks 마이그레이션
-- Supabase SQL Editor에서 실행하세요
-- =============================================

create table if not exists albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist_name text,
  description text,
  cover_url text,
  created_at timestamptz default now()
);

create table if not exists album_tracks (
  id uuid primary key default gen_random_uuid(),
  album_id uuid references albums(id) on delete cascade not null,
  track_order integer not null,
  title text not null,
  description text,
  audio_url text not null,
  duration integer,
  is_title_track boolean not null default false,
  created_at timestamptz default now()
);

create unique index if not exists album_tracks_album_order_idx
  on album_tracks(album_id, track_order);

alter table albums enable row level security;
alter table album_tracks enable row level security;

create policy "albums: 전체 읽기" on albums
  for select using (true);

create policy "albums: 관리자 insert" on albums
  for insert with check (public.is_admin());

create policy "albums: 관리자 update" on albums
  for update using (public.is_admin());

create policy "albums: 관리자 delete" on albums
  for delete using (public.is_admin());

create policy "album_tracks: 전체 읽기" on album_tracks
  for select using (true);

create policy "album_tracks: 관리자 insert" on album_tracks
  for insert with check (public.is_admin());

create policy "album_tracks: 관리자 update" on album_tracks
  for update using (public.is_admin());

create policy "album_tracks: 관리자 delete" on album_tracks
  for delete using (public.is_admin());

-- (선택) 기존 tracks 데이터를 albums로 이전
-- insert into albums (id, title, artist_name, description, cover_url, created_at)
-- select gen_random_uuid(), title, artist_name, description, cover_url, created_at from tracks;
-- 위 방식은 id 매핑이 필요하므로 수동 재등록을 권장합니다.
