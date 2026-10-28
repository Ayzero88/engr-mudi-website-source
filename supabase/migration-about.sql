-- ============================================================
-- Ayzeroxa website — About section migration (2026-10-28)
-- Run this ONCE in the Supabase SQL editor. It adds the
-- about_text table that the admin panel's About section and the
-- public About section read from. Safe to re-run.
-- ============================================================

create table if not exists about_text (
  id int primary key default 1,
  body text not null,
  constraint about_single_row check (id = 1)
);

alter table about_text enable row level security;

drop policy if exists "public read" on about_text;
create policy "public read" on about_text for select to anon, authenticated using (true);

drop policy if exists "owner write" on about_text;
create policy "owner write" on about_text for all to authenticated using (true) with check (true);

insert into about_text (id, body)
values (
  1,
  'Ayzeroxa Technologies builds software and tutors people from no tech background to fullstack developers. We started in 2023, and our founder is Osemudiamen Ayo-Okhiria.'
)
on conflict (id) do nothing;
