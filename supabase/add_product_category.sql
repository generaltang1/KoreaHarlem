-- IN STORE 상품 카테고리 (Shop All은 목록 필터용, DB 값 아님)
-- Supabase SQL Editor에서 실행하세요
--
-- 기존 상품은 Admin 상품관리에서 카테고리를 직접 지정하세요.
-- category가 null인 상품은 Shop All에만 노출되고, 카테고리별 메뉴에는 나오지 않습니다.

alter table products add column if not exists category text;
alter table products add column if not exists subcategory text;

alter table products drop constraint if exists products_category_check;
alter table products add constraint products_category_check
  check (category is null or category in ('merch', 'cd', 'ticket'));

alter table products drop constraint if exists products_subcategory_check;
alter table products add constraint products_subcategory_check
  check (
    category is null
    or (category = 'merch' and subcategory in ('tops', 'bottoms', 'accessory'))
    or (category in ('cd', 'ticket') and subcategory is null)
  );

create index if not exists products_category_idx on products(category, subcategory);
