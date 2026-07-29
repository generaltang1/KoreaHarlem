-- =============================================
-- Supabase Storage 버킷 생성 및 정책
-- SQL Editor에서 실행하세요
-- =============================================

-- audio 버킷 생성 (음원 파일)
insert into storage.buckets (id, name, public)
values ('audio', 'audio', true)
on conflict (id) do nothing;

-- images 버킷 생성 (이미지)
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- =============================================
-- Storage RLS 정책: images 버킷
-- =============================================
create policy "images: 전체 읽기" on storage.objects
  for select using (bucket_id = 'images');

create policy "images: 관리자 업로드" on storage.objects
  for insert with check (
    bucket_id = 'images' and public.is_admin()
  );

create policy "images: 관리자 삭제" on storage.objects
  for delete using (
    bucket_id = 'images' and public.is_admin()
  );

-- =============================================
-- Storage RLS 정책: audio 버킷
-- =============================================
create policy "audio: 전체 읽기" on storage.objects
  for select using (bucket_id = 'audio');

create policy "audio: 관리자 업로드" on storage.objects
  for insert with check (
    bucket_id = 'audio' and public.is_admin()
  );

create policy "audio: 관리자 삭제" on storage.objects
  for delete using (
    bucket_id = 'audio' and public.is_admin()
  );
