-- F-09 교환·반품 첨부 사진 + 단순변심 반품비 기록
-- Supabase SQL Editor에서 실행

alter table public.order_cs_requests
  add column if not exists reason_code text;

alter table public.order_cs_requests
  add column if not exists return_shipping_fee_krw integer not null default 0;

comment on column public.order_cs_requests.reason_code is 'change_mind | defect | wrong';
comment on column public.order_cs_requests.return_shipping_fee_krw is '단순 변심 등 고객 부담 반품비(원). 환불 시 차감';

create table if not exists public.order_cs_attachments (
  id uuid primary key default gen_random_uuid(),
  cs_request_id uuid not null references public.order_cs_requests(id) on delete cascade,
  file_url text not null,
  file_name text,
  mime_type text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists order_cs_attachments_cs_request_id_idx
  on public.order_cs_attachments (cs_request_id);

alter table public.order_cs_attachments enable row level security;

drop policy if exists "order_cs_attachments: 관리자 읽기" on public.order_cs_attachments;
create policy "order_cs_attachments: 관리자 읽기"
  on public.order_cs_attachments for select
  using (public.is_admin());

drop policy if exists "order_cs_attachments: 관리자 삭제" on public.order_cs_attachments;
create policy "order_cs_attachments: 관리자 삭제"
  on public.order_cs_attachments for delete
  using (public.is_admin());

-- Storage: cs-claims 버킷 (반품·교환 증빙 사진)
insert into storage.buckets (id, name, public, file_size_limit)
values ('cs-claims', 'cs-claims', true, 20971520)
on conflict (id) do update set public = true, file_size_limit = 20971520;

drop policy if exists "cs-claims: 전체 읽기" on storage.objects;
create policy "cs-claims: 전체 읽기" on storage.objects
  for select using (bucket_id = 'cs-claims');

drop policy if exists "cs-claims: 관리자 삭제" on storage.objects;
create policy "cs-claims: 관리자 삭제" on storage.objects
  for delete using (
    bucket_id = 'cs-claims' and public.is_admin()
  );
