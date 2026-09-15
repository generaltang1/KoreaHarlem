-- THINK 게시글 댓글
-- Supabase SQL Editor에서 실행하세요

alter table think_posts
  add column if not exists comment_count integer not null default 0;

create table if not exists think_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references think_posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author_nickname text not null,
  author_ip text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists think_comments_post_id_idx
  on think_comments (post_id, created_at asc);

alter table think_comments enable row level security;

create policy "think_comments: 전체 읽기"
  on think_comments for select
  using (true);

create policy "think_comments: 관리자 삭제"
  on think_comments for delete
  using (public.is_admin());

-- insert는 API(service role)로 처리

create or replace function public.think_comments_adjust_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update think_posts
      set comment_count = comment_count + 1,
          updated_at = now()
    where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update think_posts
      set comment_count = greatest(comment_count - 1, 0),
          updated_at = now()
    where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists think_comments_count_trg on think_comments;
create trigger think_comments_count_trg
  after insert or delete on think_comments
  for each row execute function public.think_comments_adjust_count();
