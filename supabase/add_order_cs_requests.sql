-- 반품/교환/환불 CS 요청 + 주문 상태 이력
-- Supabase SQL Editor에서 실행하세요

create table if not exists order_cs_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  request_type text not null check (request_type in ('return', 'exchange', 'refund')),
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'rejected', 'received', 'completed', 'cancelled')),
  reason text not null,
  admin_note text,
  exchange_size text,
  previous_status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  resolved_at timestamptz
);

create index if not exists order_cs_requests_order_id_idx on order_cs_requests(order_id);
create index if not exists order_cs_requests_status_idx on order_cs_requests(status);

create table if not exists order_status_histories (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  reason text,
  created_at timestamptz default now()
);

create index if not exists order_status_histories_order_id_idx on order_status_histories(order_id);

alter table order_cs_requests enable row level security;
alter table order_status_histories enable row level security;

create policy "order_cs_requests: 본인 읽기"
  on order_cs_requests for select
  using (auth.uid() = user_id or public.is_admin());

create policy "order_cs_requests: 본인 insert"
  on order_cs_requests for insert
  with check (auth.uid() = user_id or public.is_admin());

create policy "order_cs_requests: 관리자 update"
  on order_cs_requests for update
  using (public.is_admin());

create policy "order_status_histories: 본인/관리자 읽기"
  on order_status_histories for select
  using (
    public.is_admin()
    or exists (
      select 1 from orders o
      where o.id = order_status_histories.order_id and o.user_id = auth.uid()
    )
  );

create policy "order_status_histories: insert"
  on order_status_histories for insert
  with check (true);

-- 반품 검수(return_received) 상태에서도 재고 복구 가능하도록
create or replace function public.restore_stock_for_paid_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if not exists (
    select 1 from orders
    where id = p_order_id
      and status in ('paid', 'preparing', 'shipped', 'delivered', 'return_requested', 'return_received')
  ) then
    raise exception 'INVALID_ORDER_STATUS';
  end if;

  for r in
    select oi.product_id, coalesce(nullif(trim(oi.size), ''), '') as size, oi.quantity
    from order_items oi
    where oi.order_id = p_order_id and oi.product_id is not null
  loop
    insert into product_size_stock (product_id, size, stock)
    values (r.product_id, r.size, r.quantity)
    on conflict (product_id, size) do update
    set stock = product_size_stock.stock + excluded.stock;

    perform sync_product_total_stock(r.product_id);
  end loop;

  delete from order_stock_reservations where order_id = p_order_id;
end;
$$;
