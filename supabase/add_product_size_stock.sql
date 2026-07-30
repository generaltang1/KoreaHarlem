-- 사이즈별 재고 + 주문 시 예약(차감) / 결제 실패 시 복구
-- Supabase SQL Editor에서 실행하세요

create table if not exists product_size_stock (
  product_id uuid not null references products(id) on delete cascade,
  size text not null default '',
  stock integer not null default 0 check (stock >= 0),
  primary key (product_id, size)
);

create table if not exists order_stock_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  size text not null default '',
  quantity integer not null check (quantity > 0),
  created_at timestamptz default now(),
  unique (order_id, product_id, size)
);

create index if not exists order_stock_reservations_order_id_idx on order_stock_reservations(order_id);
create index if not exists product_size_stock_product_id_idx on product_size_stock(product_id);

-- 기존 products.stock → 사이즈별 재고로 복사 (각 사이즈에 동일 수량)
insert into product_size_stock (product_id, size, stock)
select p.id, coalesce(s.sz, ''), p.stock
from products p
cross join lateral unnest(
  case when cardinality(p.sizes) > 0 then p.sizes else array['']::text[]
  end
) as s(sz)
on conflict (product_id, size) do nothing;

alter table product_size_stock enable row level security;
alter table order_stock_reservations enable row level security;

create policy "product_size_stock: 공개 읽기" on product_size_stock
  for select using (true);

create policy "product_size_stock: 관리자 쓰기" on product_size_stock
  for all using (public.is_admin());

-- products.stock 합계 동기화
create or replace function public.sync_product_total_stock(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update products
  set stock = coalesce(
    (select sum(pss.stock) from product_size_stock pss where pss.product_id = p_product_id),
    0
  )
  where id = p_product_id;
end;
$$;

-- 주문 생성 후 재고 예약(차감)
create or replace function public.reserve_stock_for_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  affected int;
begin
  if exists (select 1 from order_stock_reservations where order_id = p_order_id) then
    return;
  end if;

  for r in
    select oi.product_id, coalesce(nullif(trim(oi.size), ''), '') as size, oi.quantity
    from order_items oi
    where oi.order_id = p_order_id and oi.product_id is not null
  loop
    update product_size_stock
    set stock = stock - r.quantity
    where product_id = r.product_id
      and size = r.size
      and stock >= r.quantity;

    get diagnostics affected = row_count;
    if affected = 0 then
      raise exception 'INSUFFICIENT_STOCK:%:%', r.product_id, r.size;
    end if;

    insert into order_stock_reservations (order_id, product_id, size, quantity)
    values (p_order_id, r.product_id, r.size, r.quantity);

    perform sync_product_total_stock(r.product_id);
  end loop;
end;
$$;

-- 결제 실패/취소 시 재고 복구
create or replace function public.release_stock_for_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if exists (select 1 from orders where id = p_order_id and status = 'paid') then
    return;
  end if;

  if not exists (select 1 from order_stock_reservations where order_id = p_order_id) then
    return;
  end if;

  for r in
    select product_id, size, quantity
    from order_stock_reservations
    where order_id = p_order_id
  loop
    update product_size_stock
    set stock = stock + r.quantity
    where product_id = r.product_id and size = r.size;

    perform sync_product_total_stock(r.product_id);
  end loop;

  delete from order_stock_reservations where order_id = p_order_id;

  update orders set status = 'cancelled' where id = p_order_id and status = 'pending';
end;
$$;

grant execute on function public.sync_product_total_stock(uuid) to authenticated;
grant execute on function public.reserve_stock_for_order(uuid) to anon, authenticated;
grant execute on function public.release_stock_for_order(uuid) to anon, authenticated;
