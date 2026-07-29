alter table album_tracks
  add column if not exists is_title_track boolean not null default false;
