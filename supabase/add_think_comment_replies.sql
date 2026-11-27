-- THINK 대댓글 (1단계 답글)
-- Supabase SQL Editor에서 실행

alter table public.think_comments
  add column if not exists parent_id uuid references public.think_comments(id) on delete cascade;

create index if not exists think_comments_parent_id_idx
  on public.think_comments (parent_id, created_at asc);

comment on column public.think_comments.parent_id is '대댓글이면 부모 댓글 id. null이면 최상위 댓글';
