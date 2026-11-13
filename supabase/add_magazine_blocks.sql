-- C Magazine: 블록 본문 · 해시태그 · 크레딧 · 관련링크 · 커버스토리 · 조회수
-- 실행 후 운영 DB에 반영. 기존 content_html 글은 앱에서 단일 paragraph로 폴백.

alter table public.magazine_posts
  add column if not exists content_blocks jsonb not null default '[]'::jsonb;

alter table public.magazine_posts
  add column if not exists hashtags text[] not null default '{}';

alter table public.magazine_posts
  add column if not exists credit_text text not null default '';

alter table public.magazine_posts
  add column if not exists credit_photo text not null default '';

alter table public.magazine_posts
  add column if not exists credit_edit text not null default '';

alter table public.magazine_posts
  add column if not exists related_links jsonb not null default '[]'::jsonb;

alter table public.magazine_posts
  add column if not exists is_cover_story boolean not null default false;

alter table public.magazine_posts
  add column if not exists view_count integer not null default 0;

alter table public.magazine_posts
  add column if not exists cover_credit text not null default '';

-- slug: 공개 URL용. 유니크(빈 문자열/NULL 허용 위해 partial unique)
create unique index if not exists magazine_posts_slug_unique_idx
  on public.magazine_posts (slug)
  where slug is not null and slug <> '';

create index if not exists magazine_posts_hashtags_gin_idx
  on public.magazine_posts using gin (hashtags);

create index if not exists magazine_posts_cover_story_idx
  on public.magazine_posts (is_cover_story, status, published_at desc nulls last)
  where is_cover_story = true;

-- 커버스토리 동시 1개: 앱 API에서도 보장. DB 트리거로 이중 보장.
create or replace function public.magazine_posts_single_cover_story()
returns trigger
language plpgsql
as $$
begin
  if new.is_cover_story is true then
    update public.magazine_posts
      set is_cover_story = false, updated_at = now()
      where is_cover_story = true
        and id is distinct from new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists magazine_posts_single_cover_story_trg on public.magazine_posts;
create trigger magazine_posts_single_cover_story_trg
  before insert or update of is_cover_story
  on public.magazine_posts
  for each row
  when (new.is_cover_story = true)
  execute function public.magazine_posts_single_cover_story();

comment on column public.magazine_posts.content_blocks is
  'Magazine body blocks JSON: paragraph|heading|quote|image|youtube|link|divider|code';
comment on column public.magazine_posts.is_cover_story is
  'C-01 hero. Only one true at a time (trigger).';
