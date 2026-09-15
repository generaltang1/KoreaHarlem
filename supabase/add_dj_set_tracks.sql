-- DJ SET 상단 고정 재생 큐
-- Supabase SQL Editor에서 실행하세요

create table if not exists dj_set_tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null default '',
  audio_url text not null,
  cover_url text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dj_set_tracks_sort_idx
  on dj_set_tracks (is_published, sort_order asc, created_at asc);

alter table dj_set_tracks enable row level security;

create policy "dj_set_tracks: 공개 읽기"
  on dj_set_tracks for select
  using (is_published = true or public.is_admin());

create policy "dj_set_tracks: 관리자 insert"
  on dj_set_tracks for insert
  with check (public.is_admin());

create policy "dj_set_tracks: 관리자 update"
  on dj_set_tracks for update
  using (public.is_admin());

create policy "dj_set_tracks: 관리자 delete"
  on dj_set_tracks for delete
  using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit)
values ('dj-set', 'dj-set', true, 524288000)
on conflict (id) do update set public = true, file_size_limit = 524288000;

drop policy if exists "dj-set: 전체 읽기" on storage.objects;
drop policy if exists "dj-set: 관리자 업로드" on storage.objects;
drop policy if exists "dj-set: 관리자 삭제" on storage.objects;

create policy "dj-set: 전체 읽기" on storage.objects
  for select using (bucket_id = 'dj-set');

create policy "dj-set: 관리자 업로드" on storage.objects
  for insert with check (bucket_id = 'dj-set' and public.is_admin());

create policy "dj-set: 관리자 삭제" on storage.objects
  for delete using (bucket_id = 'dj-set' and public.is_admin());
