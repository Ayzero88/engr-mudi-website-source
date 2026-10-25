-- ============================================================
-- Migration: coaching topics + current-training note.
-- Run ONCE in the Supabase SQL editor (project engr-mudi-website).
-- Safe to re-check: the table/column creation is guarded, but the
-- topic inserts below run once — do not re-run them, or topics
-- will appear twice.
-- ============================================================

create table if not exists coaching_topics (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  position int not null default 0
);

alter table coaching_topics enable row level security;

drop policy if exists "public read" on coaching_topics;
create policy "public read" on coaching_topics
  for select to anon, authenticated using (true);

drop policy if exists "owner write" on coaching_topics;
create policy "owner write" on coaching_topics
  for all to authenticated using (true) with check (true);

alter table coaching add column if not exists note text not null default '';

insert into coaching_topics (label, position) values
  ('Front End Development', 1),
  ('Backend Development', 2),
  ('Fullstack Development', 3),
  ('How to Use AI Agents', 4),
  ('Flutter Development for Mobile', 5),
  ('Machine Learning', 6),
  ('Mathematics', 7);

update coaching
set note = 'Currently training Batch 2026 Batch B students in Front End Development.'
where id = 1;
