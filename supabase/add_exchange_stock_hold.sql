-- 교환 CS: 희망 사이즈 재고 hold / 해제 / 완료(원사이즈 복구 + order_items 갱신)
-- Supabase SQL Editor에서 실행하세요

alter table order_cs_requests
  add column if not exists order_item_id uuid references order_items(id) on delete set null;

alter table order_cs_requests
  add column if not exists hold_product_id uuid references products(id) on delete set null;

alter table order_cs_requests
  add column if not exists hold_size text;

alter table order_cs_requests
  add column if not exists hold_quantity integer;

alter table order_cs_requests
  add column if not exists stock_held_at timestamptz;

alter table order_cs_requests
  add column if not exists stock_released_at timestamptz;

alter table order_cs_requests
  add column if not exists stock_completed_at timestamptz;

create index if not exists order_cs_requests_order_item_id_idx
  on order_cs_requests(order_item_id);

-- 승인 시: 희망 사이즈 재고 차감(hold). 이미 hold면 멱등.
create or replace function public.hold_exchange_size_stock(p_cs_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req record;
  v_item record;
  v_new_size text;
  v_qty integer;
  v_product_id uuid;
  affected int;
begin
  select *
  into v_req
  from order_cs_requests
  where id = p_cs_request_id
  for update;

  if not found then
    raise exception 'CS_REQUEST_NOT_FOUND';
  end if;

  if v_req.request_type <> 'exchange' then
    raise exception 'NOT_EXCHANGE';
  end if;

  if v_req.stock_completed_at is not null then
    raise exception 'ALREADY_COMPLETED';
  end if;

  if v_req.stock_released_at is not null then
    raise exception 'ALREADY_RELEASED';
  end if;

  -- 이미 hold됨
  if v_req.stock_held_at is not null then
    return jsonb_build_object(
      'id', v_req.id,
      'held', true,
      'already', true,
      'product_id', v_req.hold_product_id,
      'size', v_req.hold_size,
      'quantity', v_req.hold_quantity
    );
  end if;

  if v_req.order_item_id is null then
    raise exception 'ORDER_ITEM_REQUIRED';
  end if;

  select id, order_id, product_id, coalesce(nullif(trim(size), ''), '') as size, quantity
  into v_item
  from order_items
  where id = v_req.order_item_id
  for update;

  if not found or v_item.order_id <> v_req.order_id then
    raise exception 'ORDER_ITEM_NOT_FOUND';
  end if;

  if v_item.product_id is null then
    raise exception 'PRODUCT_REQUIRED';
  end if;

  v_new_size := coalesce(nullif(trim(v_req.exchange_size), ''), '');
  if v_new_size = v_item.size then
    raise exception 'SAME_SIZE';
  end if;

  v_qty := v_item.quantity;
  v_product_id := v_item.product_id;

  -- 사이즈 행이 없으면 0으로 생성 후 차감 시도
  insert into product_size_stock (product_id, size, stock)
  values (v_product_id, v_new_size, 0)
  on conflict (product_id, size) do nothing;

  update product_size_stock
  set stock = stock - v_qty
  where product_id = v_product_id
    and size = v_new_size
    and stock >= v_qty;

  get diagnostics affected = row_count;
  if affected = 0 then
    raise exception 'INSUFFICIENT_STOCK:%:%', v_product_id, v_new_size;
  end if;

  perform sync_product_total_stock(v_product_id);

  update order_cs_requests
  set
    hold_product_id = v_product_id,
    hold_size = v_new_size,
    hold_quantity = v_qty,
    stock_held_at = now(),
    updated_at = now()
  where id = p_cs_request_id;

  return jsonb_build_object(
    'id', p_cs_request_id,
    'held', true,
    'already', false,
    'product_id', v_product_id,
    'size', v_new_size,
    'quantity', v_qty
  );
end;
$$;

-- 반려/취소 시: hold 해제. 미hold·이미 해제·완료면 멱등.
create or replace function public.release_exchange_size_stock(p_cs_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req record;
begin
  select *
  into v_req
  from order_cs_requests
  where id = p_cs_request_id
  for update;

  if not found then
    raise exception 'CS_REQUEST_NOT_FOUND';
  end if;

  if v_req.stock_held_at is null or v_req.stock_released_at is not null then
    return jsonb_build_object('id', p_cs_request_id, 'released', false, 'noop', true);
  end if;

  if v_req.stock_completed_at is not null then
    raise exception 'ALREADY_COMPLETED';
  end if;

  if v_req.hold_product_id is null or v_req.hold_quantity is null then
    update order_cs_requests
    set stock_released_at = now(), updated_at = now()
    where id = p_cs_request_id;
    return jsonb_build_object('id', p_cs_request_id, 'released', false, 'noop', true);
  end if;

  insert into product_size_stock (product_id, size, stock)
  values (
    v_req.hold_product_id,
    coalesce(nullif(trim(v_req.hold_size), ''), ''),
    v_req.hold_quantity
  )
  on conflict (product_id, size) do update
  set stock = product_size_stock.stock + excluded.stock;

  perform sync_product_total_stock(v_req.hold_product_id);

  update order_cs_requests
  set stock_released_at = now(), updated_at = now()
  where id = p_cs_request_id;

  return jsonb_build_object(
    'id', p_cs_request_id,
    'released', true,
    'product_id', v_req.hold_product_id,
    'size', v_req.hold_size,
    'quantity', v_req.hold_quantity
  );
end;
$$;

-- 완료 시: 원사이즈 재고 복구 + order_items.size 갱신. hold(희망 사이즈)는 유지.
create or replace function public.complete_exchange_stock(p_cs_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req record;
  v_item record;
  v_old_size text;
  v_new_size text;
begin
  select *
  into v_req
  from order_cs_requests
  where id = p_cs_request_id
  for update;

  if not found then
    raise exception 'CS_REQUEST_NOT_FOUND';
  end if;

  if v_req.request_type <> 'exchange' then
    raise exception 'NOT_EXCHANGE';
  end if;

  if v_req.stock_completed_at is not null then
    return jsonb_build_object('id', p_cs_request_id, 'completed', true, 'already', true);
  end if;

  if v_req.stock_released_at is not null then
    raise exception 'ALREADY_RELEASED';
  end if;

  if v_req.stock_held_at is null then
    raise exception 'HOLD_REQUIRED';
  end if;

  if v_req.order_item_id is null then
    raise exception 'ORDER_ITEM_REQUIRED';
  end if;

  select id, order_id, product_id, coalesce(nullif(trim(size), ''), '') as size, quantity
  into v_item
  from order_items
  where id = v_req.order_item_id
  for update;

  if not found or v_item.order_id <> v_req.order_id then
    raise exception 'ORDER_ITEM_NOT_FOUND';
  end if;

  if v_item.product_id is null then
    raise exception 'PRODUCT_REQUIRED';
  end if;

  v_old_size := v_item.size;
  v_new_size := coalesce(nullif(trim(v_req.exchange_size), ''), '');

  -- 반품된 원사이즈 복구
  insert into product_size_stock (product_id, size, stock)
  values (v_item.product_id, v_old_size, v_item.quantity)
  on conflict (product_id, size) do update
  set stock = product_size_stock.stock + excluded.stock;

  perform sync_product_total_stock(v_item.product_id);

  update order_items
  set size = v_new_size
  where id = v_item.id;

  update order_cs_requests
  set stock_completed_at = now(), updated_at = now()
  where id = p_cs_request_id;

  return jsonb_build_object(
    'id', p_cs_request_id,
    'completed', true,
    'already', false,
    'from_size', v_old_size,
    'to_size', v_new_size,
    'quantity', v_item.quantity,
    'product_id', v_item.product_id
  );
end;
$$;
