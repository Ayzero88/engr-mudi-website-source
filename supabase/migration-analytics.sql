-- ============================================================
-- Migration: site-wide page-view analytics.
-- Run ONCE in the Supabase SQL editor (project engr-mudi-website).
-- Run BEFORE deploying code that writes to this table.
-- Privacy: no IP addresses, no user agents, no names, no emails.
-- Only the page path, an anonymous random session id stored in
-- the visitor's own browser, the referrer hostname (if any), and
-- a timestamp. Admin pages are never tracked.
-- ============================================================

create table if not exists site_page_views (
  id uuid primary key default gen_random_uuid(),
  page text not null,
  session_id text not null default '',
  referrer text not null default '',
  viewed_at timestamptz not null default now()
);

alter table site_page_views enable row level security;

drop policy if exists "anon insert" on site_page_views;
create policy "anon insert" on site_page_views
  for insert to anon, authenticated with check (true);

drop policy if exists "owner read" on site_page_views;
create policy "owner read" on site_page_views
  for select to authenticated using (true);
