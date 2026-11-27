-- albums.album_type 에 mixtape 추가
-- Supabase SQL Editor에서 실행하세요

alter table public.albums drop constraint if exists albums_album_type_check;

alter table public.albums
  add constraint albums_album_type_check
  check (
    album_type is null
    or album_type in ('single', 'ep', 'album', 'mix', 'mixtape', 'playlist')
  );
