-- 비회원 주문번호·조회 비밀번호·배송지 상세
-- Supabase SQL Editor에서 실행하세요

alter table orders add column if not exists order_number text unique;
alter table orders add column if not exists guest_password_hash text;
alter table orders add column if not exists customer_phone text;
alter table orders add column if not exists shipping_message text;

create index if not exists orders_order_number_idx on orders(order_number);

-- 주문번호 일별 시퀀스 (YYYYMMDD-0000001 형식)
create table if not exists order_number_seq (
  day_key text primary key,
  last_seq integer not null default 0
);

alter table order_number_seq enable row level security;

-- 서버(service role)에서만 사용 — anon에는 정책 없음

-- 일별 주문번호 발급 (API에서 supabase.rpc('allocate_order_number') 호출)
create or replace function public.allocate_order_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  dk text := to_char((timezone('Asia/Seoul', now()))::date, 'YYYYMMDD');
  ns integer;
begin
  insert into order_number_seq as s (day_key, last_seq)
  values (dk, 1)
  on conflict (day_key) do update
  set last_seq = s.last_seq + 1
  returning s.last_seq into ns;
  return dk || '-' || lpad(ns::text, 7, '0');
end;
$$;

grant execute on function public.allocate_order_number() to anon, authenticated;
