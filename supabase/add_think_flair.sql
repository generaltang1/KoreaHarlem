-- THINK 플레어 (D-01 필터 · D-03 작성)
-- Supabase SQL Editor에서 실행

alter table public.think_posts
  add column if not exists flair text;

comment on column public.think_posts.flair is 'THINK 플레어 라벨 (예: 음악, 패션, 잡담)';

create index if not exists think_posts_flair_idx
  on public.think_posts (flair)
  where flair is not null;
