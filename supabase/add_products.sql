-- =============================================
-- SALE 상품 / 주문 스키마
-- Supabase SQL Editor에서 실행하세요
-- =============================================

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  price_krw integer not null check (price_krw >= 0),
  compare_at_price_krw integer check (compare_at_price_krw is null or compare_at_price_krw >= 0),
  stock integer not null default 0 check (stock >= 0),
  sizes text[] not null default '{}',
  is_sale boolean not null default true,
  is_published boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

create index if not exists product_images_product_id_idx on product_images(product_id);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,
  status text not null default 'pending',
  currency text not null,
  exchange_rate numeric not null,
  subtotal integer not null,
  total integer not null,
  customer_email text,
  customer_name text,
  shipping_address jsonb,
  toss_order_id text unique,
  toss_payment_key text,
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  title text not null,
  size text,
  quantity integer not null check (quantity > 0),
  unit_price integer not null,
  currency text not null,
  image_url text,
  created_at timestamptz default now()
);

create index if not exists order_items_order_id_idx on order_items(order_id);

alter table products enable row level security;
alter table product_images enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "products: 공개 읽기" on products
  for select using (is_published = true or public.is_admin());

create policy "products: 관리자 insert" on products
  for insert with check (public.is_admin());

create policy "products: 관리자 update" on products
  for update using (public.is_admin());

create policy "products: 관리자 delete" on products
  for delete using (public.is_admin());

create policy "product_images: 전체 읽기" on product_images
  for select using (true);

create policy "product_images: 관리자 insert" on product_images
  for insert with check (public.is_admin());

create policy "product_images: 관리자 update" on product_images
  for update using (public.is_admin());

create policy "product_images: 관리자 delete" on product_images
  for delete using (public.is_admin());

create policy "orders: 본인 읽기" on orders
  for select using (auth.uid() = user_id or public.is_admin());

create policy "orders: 본인/게스트 insert" on orders
  for insert with check (user_id is null or auth.uid() = user_id or public.is_admin());

create policy "orders: 본인/관리자 update" on orders
  for update using (auth.uid() = user_id or public.is_admin());

create policy "order_items: 주문 소유자 읽기" on order_items
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "order_items: insert" on order_items
  for insert with check (true);
