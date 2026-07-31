-- restore_stock_for_paid_order: 배송준비중(preparing) 취소 시에도 재고 복구 허용
-- Supabase SQL Editor에서 실행하세요

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
      and status in ('paid', 'preparing', 'shipped', 'delivered')
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
