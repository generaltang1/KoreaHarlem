-- Optional: store which Toss method was used (domestic_card | intl_card | paypal)
alter table orders add column if not exists payment_method text;
