-- ============================================================
-- Migration: blog threads + posts + view counter.
-- Run ONCE in the Supabase SQL editor (project engr-mudi-website).
-- Run BEFORE deploying code that reads these tables.
-- No content is seeded: threads and posts are added from the
-- admin panel (Manage website -> Blog) when the owner is ready.
-- ============================================================

create table if not exists blog_threads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null default '',
  slug text not null unique,
  description text not null default '',
  buy_label text not null default '',
  buy_url text not null default '',
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references blog_threads (id) on delete cascade,
  title text not null,
  slug text not null,
  body text not null default '',
  day_order int not null default 0,
  published boolean not null default true,
  views int not null default 0,
  created_at timestamptz not null default now(),
  unique (thread_id, slug)
);

alter table blog_threads enable row level security;
alter table blog_posts enable row level security;

drop policy if exists "public read" on blog_threads;
create policy "public read" on blog_threads
  for select to anon, authenticated using (true);

drop policy if exists "public read published" on blog_posts;
create policy "public read published" on blog_posts
  for select to anon, authenticated using (published = true);

drop policy if exists "owner write" on blog_threads;
create policy "owner write" on blog_threads
  for all to authenticated using (true) with check (true);

drop policy if exists "owner write" on blog_posts;
create policy "owner write" on blog_posts
  for all to authenticated using (true) with check (true);

-- View counter: anyone reading a post may bump its counter by one.
-- SECURITY DEFINER so anonymous readers can increment without a
-- general update policy on the table. It can only add 1 to views.
create or replace function public.increment_post_views(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update blog_posts set views = views + 1 where id = p_id;
$$;

grant execute on function public.increment_post_views(uuid) to anon, authenticated;
