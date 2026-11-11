-- DJ SET 라이브 설정 (단일 행)
-- add_admin_dashboard_phase2.sql 에도 포함되어 있습니다. 단독 실행용.

create table if not exists public.dj_set_settings (
  id int primary key default 1 check (id = 1),
  live_platform text not null default 'youtube',
  live_url text,
  live_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.dj_set_settings (id, live_platform, live_enabled)
values (1, 'youtube', false)
on conflict (id) do nothing;

alter table public.dj_set_settings enable row level security;

drop policy if exists "dj_set_settings: 공개 읽기" on public.dj_set_settings;
create policy "dj_set_settings: 공개 읽기"
  on public.dj_set_settings for select
  using (true);

drop policy if exists "dj_set_settings: 관리자 수정" on public.dj_set_settings;
create policy "dj_set_settings: 관리자 수정"
  on public.dj_set_settings for update
  using (public.is_admin())
  with check (public.is_admin());
