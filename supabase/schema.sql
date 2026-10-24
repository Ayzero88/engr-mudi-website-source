-- ============================================================
-- Engr Mudi website — Supabase schema
-- Run this in the Supabase SQL editor BEFORE seed.sql.
-- No secrets live here. The app connects with the project's
-- anon key (VITE_SUPABASE_ANON_KEY) and relies on these
-- Row Level Security policies:
--   * Everyone (anon + authenticated) can READ all content.
--   * Only logged-in users (the owner, via Supabase Auth)
--     can INSERT / UPDATE / DELETE.
-- ============================================================

-- ---------- tables ----------

create table if not exists hero (
  id int primary key default 1,
  full_name text not null,
  brand_tag text not null,
  shorts_label text not null,
  shorts_url text not null,
  logo_url text not null,
  constraint hero_single_row check (id = 1)
);

create table if not exists stack_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  position int not null default 0
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  tagline text,
  status text not null default 'LIVE',
  image_url text not null,
  position int not null default 0
);

create table if not exists coaching (
  id int primary key default 1,
  body text not null,
  constraint coaching_single_row check (id = 1)
);

create table if not exists coaching_photos (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text not null default '',
  position int not null default 0
);

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  price_ngn int,
  price_label text not null,
  selar_url text,
  paystack_url text,
  coming_soon boolean not null default false,
  position int not null default 0
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  position int not null default 0
);

create table if not exists social_links (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text not null,
  position int not null default 0
);

create table if not exists hire_text (
  id int primary key default 1,
  body text not null,
  constraint hire_single_row check (id = 1)
);

-- ---------- Row Level Security ----------
-- Public read, authenticated-only write, on every table.

alter table hero enable row level security;
alter table stack_items enable row level security;
alter table projects enable row level security;
alter table coaching enable row level security;
alter table coaching_photos enable row level security;
alter table books enable row level security;
alter table services enable row level security;
alter table social_links enable row level security;
alter table hire_text enable row level security;

-- Read policies (anon + authenticated)
do $$
declare t text;
begin
  for t in select unnest(array[
    'hero','stack_items','projects','coaching','coaching_photos',
    'books','services','social_links','hire_text'
  ]) loop
    execute format(
      'drop policy if exists "public read" on %I; '
      'create policy "public read" on %I for select to anon, authenticated using (true);',
      t, t);
  end loop;
end $$;

-- Write policies (authenticated users only: the owner, via Supabase Auth)
do $$
declare t text;
begin
  for t in select unnest(array[
    'hero','stack_items','projects','coaching','coaching_photos',
    'books','services','social_links','hire_text'
  ]) loop
    execute format(
      'drop policy if exists "owner write" on %I; '
      'create policy "owner write" on %I for all to authenticated using (true) with check (true);',
      t, t);
  end loop;
end $$;

-- ---------- image Storage bucket ----------
-- Create the bucket (public, so uploaded images can be shown on the
-- public site), then lock writes to logged-in users only.

insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

drop policy if exists "site images public read" on storage.objects;
create policy "site images public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'site-images');

drop policy if exists "site images owner write" on storage.objects;
create policy "site images owner write"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'site-images')
  with check (bucket_id = 'site-images');
