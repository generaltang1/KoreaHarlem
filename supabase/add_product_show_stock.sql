-- 재고표시상태: 구매자 상품 상세에 남은 재고 수량 노출 여부
-- Supabase SQL Editor에서 실행하세요
--
-- show_stock = true  → 표시함 (사이즈 옵션·수량 영역에 재고 수량 노출)
-- show_stock = false → 표시안함 (품절만 표시, 남은 수량은 숨김)
-- Admin 재고 관리·수기 조정은 항상 가능

alter table products
  add column if not exists show_stock boolean not null default true;

comment on column products.show_stock is '재고표시상태: true=표시함, false=표시안함 (구매자 상세)';
