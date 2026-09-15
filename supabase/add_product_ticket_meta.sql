-- 티켓 상품 메타 + 메인 노출 플래그
-- Supabase SQL Editor에서 실행하세요

alter table products
  add column if not exists event_starts_at timestamptz;

alter table products
  add column if not exists event_ends_at timestamptz;

alter table products
  add column if not exists venue text;

alter table products
  add column if not exists minors_allowed boolean not null default false;

alter table products
  add column if not exists lineup jsonb not null default '[]'::jsonb;

alter table products
  add column if not exists featured_on_home boolean not null default false;

create index if not exists products_featured_ticket_idx
  on products (featured_on_home, created_at desc)
  where category = 'ticket';

comment on column products.lineup is
  '티켓 라인업 [{ "time_label": "20:00-21:00", "role": "DJ SET", "artist_name": "..." }]';
comment on column products.featured_on_home is
  '메인 홈 티켓 섹션 노출 (티켓만). 앱에서 한 개만 true 유지 권장';
