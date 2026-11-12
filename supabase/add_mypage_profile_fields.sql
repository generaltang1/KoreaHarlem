-- 마이페이지 내 정보 변경 (F-10)
-- nickname / phone / 기본배송지 / 주문·배송 알림

alter table public.profiles
  add column if not exists nickname text;

alter table public.profiles
  add column if not exists phone text;

alter table public.profiles
  add column if not exists default_shipping jsonb;

alter table public.profiles
  add column if not exists notify_order boolean not null default true;

comment on column public.profiles.nickname is '표시 닉네임 (THINK 글·댓글 등)';
comment on column public.profiles.phone is '연락처';
comment on column public.profiles.default_shipping is '기본 배송지 {postcode,address,addressDetail,phone}';
comment on column public.profiles.notify_order is '주문·배송 알림 수신';

-- 본인 프로필 수정 (마케팅 정책과 별도로 전체 컬럼 업데이트 허용)
drop policy if exists "profiles: 본인 마케팅동의 수정" on public.profiles;
drop policy if exists "profiles: 본인 정보 수정" on public.profiles;
create policy "profiles: 본인 정보 수정"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
