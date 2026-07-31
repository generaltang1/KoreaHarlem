-- 관리자 재고 수기 조정 이력 + 원자적 조정 함수
-- Supabase SQL Editor에서 실행하세요

create table if not exists stock_adjustment_logs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  size text not null default '',
  delta integer not null check (delta <> 0),
  stock_before integer not null,
  stock_after integer not null check (stock_after >= 0),
  reason text not null,
  adjusted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists stock_adjustment_logs_product_id_idx
  on stock_adjustment_logs(product_id, created_at desc);

alter table stock_adjustment_logs enable row level security;

create policy "stock_adjustment_logs: 관리자 읽기"
  on stock_adjustment_logs for select
  using (public.is_admin());

create policy "stock_adjustment_logs: 관리자 insert"
  on stock_adjustment_logs for insert
  with check (public.is_admin());

-- ±수량 조정 (음수 재고 방지) + 이력 + products.stock 동기화
create or replace function public.adjust_product_size_stock(
  p_product_id uuid,
  p_size text,
  p_delta integer,
  p_reason text,
  p_adjusted_by uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_size text := coalesce(nullif(trim(p_size), ''), '');
  v_before integer;
  v_after integer;
  v_log_id uuid;
begin
  if p_delta is null or p_delta = 0 then
    raise exception 'INVALID_DELTA';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'REASON_REQUIRED';
  end if;

  if not exists (select 1 from products where id = p_product_id) then
    raise exception 'PRODUCT_NOT_FOUND';
  end if;

  select stock into v_before
  from product_size_stock
  where product_id = p_product_id and size = v_size
  for update;

  if v_before is null then
    v_before := 0;
    insert into product_size_stock (product_id, size, stock)
    values (p_product_id, v_size, 0);
  end if;

  v_after := v_before + p_delta;
  if v_after < 0 then
    raise exception 'INSUFFICIENT_STOCK';
  end if;

  update product_size_stock
  set stock = v_after
  where product_id = p_product_id and size = v_size;

  insert into stock_adjustment_logs (
    product_id, size, delta, stock_before, stock_after, reason, adjusted_by
  )
  values (
    p_product_id, v_size, p_delta, v_before, v_after, trim(p_reason), p_adjusted_by
  )
  returning id into v_log_id;

  perform sync_product_total_stock(p_product_id);

  return jsonb_build_object(
    'id', v_log_id,
    'product_id', p_product_id,
    'size', v_size,
    'delta', p_delta,
    'stock_before', v_before,
    'stock_after', v_after
  );
end;
$$;
