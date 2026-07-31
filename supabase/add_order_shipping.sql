-- 배송/송장 필드 (Cafe24형 배송 상태 관리)
-- Supabase SQL Editor에서 실행하세요

alter table orders add column if not exists tracking_courier text;
alter table orders add column if not exists tracking_number text;
alter table orders add column if not exists prepared_at timestamptz;
alter table orders add column if not exists shipped_at timestamptz;
alter table orders add column if not exists delivered_at timestamptz;
