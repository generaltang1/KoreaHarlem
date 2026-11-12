-- =============================================
-- tip_reports: 인스타그램·게스트 비밀번호(해시)
-- Supabase SQL Editor에서 실행하세요
-- =============================================

alter table public.tip_reports
  add column if not exists instagram_handle text;

alter table public.tip_reports
  add column if not exists access_password_hash text;

comment on column public.tip_reports.instagram_handle is '제보 시 선택 입력한 인스타그램 아이디';
comment on column public.tip_reports.access_password_hash is '비회원 제보 수정·삭제용 비밀번호 SHA-256 해시';
