-- FLAC 다운로드 URL 컬럼
-- Supabase SQL Editor에서 실행하세요

alter table album_tracks
  add column if not exists download_flac_url text;
