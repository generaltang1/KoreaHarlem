-- =============================================
-- profiles: 마케팅 수신 동의 컬럼
-- Supabase SQL Editor에서 실행하세요
-- =============================================

alter table public.profiles
  add column if not exists marketing_consent boolean not null default false;

alter table public.profiles
  add column if not exists marketing_consent_at timestamptz;

-- 신규 가입 시 user_metadata.marketing_consent 를 profiles 에 반영
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, marketing_consent, marketing_consent_at)
  values (
    new.id,
    'user',
    coalesce((new.raw_user_meta_data->>'marketing_consent')::boolean, false),
    case
      when coalesce((new.raw_user_meta_data->>'marketing_consent')::boolean, false)
      then now()
      else null
    end
  );
  return new;
end;
$$;

-- 본인이 자신의 marketing_consent 를 수정할 수 있도록 (이미 update 정책이 있으면 유지)
drop policy if exists "profiles: 본인 마케팅동의 수정" on public.profiles;
create policy "profiles: 본인 마케팅동의 수정"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

comment on column public.profiles.marketing_consent is '마케팅 정보 수신 동의 (선택)';
comment on column public.profiles.marketing_consent_at is '마케팅 동의 시각';
