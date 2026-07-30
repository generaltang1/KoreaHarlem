-- 상품 상세 확장: 배송비, 사이즈 가이드, 추가구성상품, 위시리스트
-- Supabase SQL Editor에서 실행하세요

alter table products add column if not exists shipping_fee_krw bigint not null default 4000 check (shipping_fee_krw >= 0);
alter table products add column if not exists free_shipping_threshold_krw bigint check (free_shipping_threshold_krw is null or free_shipping_threshold_krw >= 0);
alter table products add column if not exists overseas_shipping boolean not null default false;
alter table products add column if not exists size_guide jsonb;

create table if not exists product_addons (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  addon_product_id uuid not null references products(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  unique (product_id, addon_product_id),
  check (product_id <> addon_product_id)
);

create index if not exists product_addons_product_id_idx on product_addons(product_id);

create table if not exists wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, product_id)
);

create index if not exists wishlist_items_user_id_idx on wishlist_items(user_id);

alter table product_addons enable row level security;
alter table wishlist_items enable row level security;

create policy "product_addons: 공개 읽기" on product_addons
  for select using (true);

create policy "product_addons: 관리자 insert" on product_addons
  for insert with check (public.is_admin());

create policy "product_addons: 관리자 update" on product_addons
  for update using (public.is_admin());

create policy "product_addons: 관리자 delete" on product_addons
  for delete using (public.is_admin());

create policy "wishlist: 본인 읽기" on wishlist_items
  for select using (auth.uid() = user_id or public.is_admin());

create policy "wishlist: 본인 insert" on wishlist_items
  for insert with check (auth.uid() = user_id);

create policy "wishlist: 본인 delete" on wishlist_items
  for delete using (auth.uid() = user_id);

alter table orders add column if not exists shipping_fee bigint not null default 0;
