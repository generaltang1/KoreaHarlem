-- 제보하기 (팁 리포트) + Storage tips 버킷
-- Supabase SQL Editor에서 실행하세요

create table if not exists tip_reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content_html text not null default '',
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists tip_reports_created_at_idx on tip_reports (created_at desc);

create table if not exists tip_report_attachments (
  id uuid primary key default gen_random_uuid(),
  tip_id uuid not null references tip_reports(id) on delete cascade,
  file_url text not null,
  file_name text,
  mime_type text,
  kind text not null default 'other'
    check (kind in ('image', 'video', 'other')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists tip_report_attachments_tip_id_idx on tip_report_attachments (tip_id);

alter table tip_reports enable row level security;
alter table tip_report_attachments enable row level security;

-- 공개 insert/select는 API(service role)로만 처리. 관리자 읽기용 정책만 둠.
create policy "tip_reports: 관리자 읽기"
  on tip_reports for select
  using (public.is_admin());

create policy "tip_reports: 관리자 삭제"
  on tip_reports for delete
  using (public.is_admin());

create policy "tip_report_attachments: 관리자 읽기"
  on tip_report_attachments for select
  using (public.is_admin());

create policy "tip_report_attachments: 관리자 삭제"
  on tip_report_attachments for delete
  using (public.is_admin());

-- Storage: tips 버킷 (제보 첨부·본문 붙여넣기 이미지)
-- 파일당 1GB (버킷 한도). Free 플랜 전역 상한은 50MB — Pro에서 Storage Settings 전역 한도를 1GB+로 올려야 함
insert into storage.buckets (id, name, public, file_size_limit)
values ('tips', 'tips', true, 1073741824)
on conflict (id) do update set public = true, file_size_limit = 1073741824;

-- 정책이 이미 있으면 있을 수 있어 drop 후 재생성
drop policy if exists "tips: 전체 읽기" on storage.objects;
drop policy if exists "tips: 관리자 삭제" on storage.objects;

create policy "tips: 전체 읽기" on storage.objects
  for select using (bucket_id = 'tips');

create policy "tips: 관리자 삭제" on storage.objects
  for delete using (
    bucket_id = 'tips' and public.is_admin()
  );

-- 업로드는 service role(API)만 사용 — anon insert 정책 없음
