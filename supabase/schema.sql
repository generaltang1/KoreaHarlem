-- =============================================
-- KoreaHarlem 데이터베이스 스키마
-- Supabase SQL Editor에서 순서대로 실행하세요
-- =============================================

-- 1. profiles 테이블 (역할 관리)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null default 'user',
  created_at timestamptz default now()
);

-- 2. artists 테이블
create table if not exists artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text,
  image_url text,
  created_at timestamptz default now()
);

-- 3. albums + album_tracks 테이블 (음악)
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

-- (레거시) tracks 테이블 — 신규 설치 시 생략 가능
create table if not exists tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist_id uuid references artists(id) on delete set null,
  artist_name text,
  description text,
  audio_url text not null,
  cover_url text,
  duration integer,
  created_at timestamptz default now()
);

-- 4. works 테이블 (상품)
create table if not exists works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist_id uuid references artists(id) on delete set null,
  category text not null,
  price integer,
  image_url text,
  description text,
  created_at timestamptz default now()
);

-- 5. events 테이블
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz default now()
);

-- =============================================
-- 트리거: 회원가입 시 profiles 자동 생성
-- =============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- RLS (Row Level Security) 활성화
-- =============================================
alter table profiles enable row level security;
alter table artists enable row level security;
alter table albums enable row level security;
alter table album_tracks enable row level security;
alter table tracks enable row level security;
alter table works enable row level security;
alter table events enable row level security;

-- =============================================
-- RLS 정책: profiles
-- =============================================
-- 본인 프로필 읽기
create policy "profiles: 본인 읽기" on profiles
  for select using (auth.uid() = id);

-- 관리자 helper 함수
create or replace function public.is_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- =============================================
-- RLS 정책: artists
-- =============================================
create policy "artists: 전체 읽기" on artists
  for select using (true);

create policy "artists: 관리자 insert" on artists
  for insert with check (public.is_admin());

create policy "artists: 관리자 update" on artists
  for update using (public.is_admin());

create policy "artists: 관리자 delete" on artists
  for delete using (public.is_admin());

-- =============================================
-- RLS 정책: albums / album_tracks
-- =============================================
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

-- =============================================
-- RLS 정책: tracks (레거시)
-- =============================================
create policy "tracks: 전체 읽기" on tracks
  for select using (true);

create policy "tracks: 관리자 insert" on tracks
  for insert with check (public.is_admin());

create policy "tracks: 관리자 update" on tracks
  for update using (public.is_admin());

create policy "tracks: 관리자 delete" on tracks
  for delete using (public.is_admin());

-- =============================================
-- RLS 정책: works
-- =============================================
create policy "works: 전체 읽기" on works
  for select using (true);

create policy "works: 관리자 insert" on works
  for insert with check (public.is_admin());

create policy "works: 관리자 update" on works
  for update using (public.is_admin());

create policy "works: 관리자 delete" on works
  for delete using (public.is_admin());

-- =============================================
-- RLS 정책: events
-- =============================================
create policy "events: 전체 읽기" on events
  for select using (true);

create policy "events: 관리자 insert" on events
  for insert with check (public.is_admin());

create policy "events: 관리자 update" on events
  for update using (public.is_admin());

create policy "events: 관리자 delete" on events
  for delete using (public.is_admin());

-- =============================================
-- 관리자 계정 수동 지정 방법 (필요 시 실행)
-- 아래 이메일을 실제 관리자 이메일로 변경 후 실행
-- =============================================
-- update profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'your-admin@email.com');
