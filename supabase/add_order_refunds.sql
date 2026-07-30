-- 주문 취소/환불 메타 + 결제완료 주문 재고 복구
-- Supabase SQL Editor에서 실행하세요

alter table orders add column if not exists cancel_reason text;
alter table orders add column if not exists cancelled_at timestamptz;
alter table orders add column if not exists refunded_at timestamptz;
alter table orders add column if not exists refunded_amount bigint;

-- 결제 완료(또는 배송) 주문 환불 시 재고 복구
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
      and status in ('paid', 'shipped', 'delivered')
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

grant execute on function public.restore_stock_for_paid_order(uuid) to authenticated;
