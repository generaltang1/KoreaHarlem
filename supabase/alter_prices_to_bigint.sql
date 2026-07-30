-- =============================================
-- 금액 컬럼 integer → bigint
-- Supabase SQL Editor에서 실행하세요
-- =============================================
-- bigint 최대값: 9,223,372,036,854,775,807 원
-- (약 92경 2,337조 … / 실질적으로 제한 없음에 가깝습니다)

alter table products
  alter column price_krw type bigint using price_krw::bigint;

alter table products
  alter column compare_at_price_krw type bigint using compare_at_price_krw::bigint;

alter table products
  alter column shipping_fee_krw type bigint using shipping_fee_krw::bigint;

alter table products
  alter column free_shipping_threshold_krw type bigint
  using free_shipping_threshold_krw::bigint;

alter table orders
  alter column subtotal type bigint using subtotal::bigint;

alter table orders
  alter column total type bigint using total::bigint;

alter table orders
  alter column shipping_fee type bigint using shipping_fee::bigint;

alter table orders
  alter column refunded_amount type bigint using refunded_amount::bigint;

alter table order_items
  alter column unit_price type bigint using unit_price::bigint;
