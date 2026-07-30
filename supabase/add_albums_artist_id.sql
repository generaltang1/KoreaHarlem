-- =============================================
-- albums.artist_id 추가 (아티스트 선행 등록 연결)
-- Supabase SQL Editor에서 실행하세요
-- =============================================

alter table albums
  add column if not exists artist_id uuid references artists(id) on delete restrict;

-- 기존 artist_name과 이름이 같은 아티스트로 백필
update albums a
set artist_id = ar.id
from artists ar
where a.artist_id is null
  and a.artist_name is not null
  and trim(a.artist_name) = trim(ar.name);

create index if not exists albums_artist_id_idx on albums(artist_id);
