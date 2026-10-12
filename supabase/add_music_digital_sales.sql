-- 디지털 음원/앨범 판매 + 구매 권한
-- Supabase SQL Editor에서 실행하세요

alter table albums
  add column if not exists digital_price_krw integer
    check (digital_price_krw is null or digital_price_krw >= 0);

alter table album_tracks
  add column if not exists digital_price_krw integer
    check (digital_price_krw is null or digital_price_krw >= 0);

alter table album_tracks
  add column if not exists download_wav_url text;

alter table album_tracks
  add column if not exists download_mp3_url text;

alter table order_items
  alter column product_id drop not null;

alter table order_items
  add column if not exists item_kind text not null default 'product';

alter table order_items
  add column if not exists album_id uuid references albums(id) on delete set null;

alter table order_items
  add column if not exists track_id uuid references album_tracks(id) on delete set null;

create table if not exists music_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  kind text not null check (kind in ('album', 'track')),
  album_id uuid references albums(id) on delete cascade,
  track_id uuid references album_tracks(id) on delete cascade,
  created_at timestamptz default now()
);

create unique index if not exists music_entitlements_user_album_uidx
  on music_entitlements (user_id, album_id)
  where kind = 'album';

create unique index if not exists music_entitlements_user_track_uidx
  on music_entitlements (user_id, track_id)
  where kind = 'track';

create index if not exists music_entitlements_user_id_idx
  on music_entitlements (user_id, created_at desc);

alter table music_entitlements enable row level security;

drop policy if exists "music_entitlements: 본인 읽기" on music_entitlements;
create policy "music_entitlements: 본인 읽기" on music_entitlements
  for select using (auth.uid() = user_id);
