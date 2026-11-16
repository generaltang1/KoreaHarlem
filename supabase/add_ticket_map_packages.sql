-- B-08 티켓: 네이버 지도 좌표 · 패키지(등급) JSON
-- 실행 후 운영 DB 반영. lineup 사진 URL은 기존 lineup jsonb 항목에 image_url 로 저장.

alter table public.products
  add column if not exists venue_lat double precision;

alter table public.products
  add column if not exists venue_lng double precision;

alter table public.products
  add column if not exists venue_address text not null default '';

alter table public.products
  add column if not exists ticket_packages jsonb not null default '[]'::jsonb;

comment on column public.products.venue_lat is 'Naver Map latitude for ticket venue pin';
comment on column public.products.venue_lng is 'Naver Map longitude for ticket venue pin';
comment on column public.products.venue_address is 'Display / search address for venue map';
comment on column public.products.ticket_packages is
  'Ticket packages [{ "id", "name", "price_krw", "description?" }]';
comment on column public.products.lineup is
  '[{ "time_label", "role?", "artist_name", "image_url?" }] — image shown only when artist_name set';
