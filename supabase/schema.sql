-- ==========================================================================
-- PerumahanKu — Supabase schema
-- Run this once in: Supabase Dashboard > SQL Editor > New query > Run
-- ==========================================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- Tables ----------

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text not null,
  type text not null check (type in ('Rumah', 'Apartemen', 'Ruko', 'Tanah')),
  status text not null check (status in ('sale', 'rent')),
  price numeric not null,
  beds int not null default 0,
  baths int not null default 0,
  area numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  photo_url text not null,
  sort_order int not null check (sort_order between 1 and 4),
  created_at timestamptz not null default now(),
  unique (listing_id, sort_order)
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text,
  created_at timestamptz not null default now()
);

create table if not exists public.visitors (
  id uuid primary key default gen_random_uuid(),
  page text not null,
  referrer text,
  user_agent text,
  visited_at timestamptz not null default now()
);

-- Owner allow-list: rows here are the only accounts allowed into /admin.
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

-- ---------- Helper: is the current auth user an admin? ----------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

-- ---------- Row Level Security ----------
alter table public.listings enable row level security;
alter table public.listing_photos enable row level security;
alter table public.registrations enable row level security;
alter table public.visitors enable row level security;
alter table public.admins enable row level security;

-- listings: public can read, only admins can write
drop policy if exists "listings_public_read" on public.listings;
create policy "listings_public_read" on public.listings
  for select using (true);

drop policy if exists "listings_admin_write" on public.listings;
create policy "listings_admin_write" on public.listings
  for all using (public.is_admin()) with check (public.is_admin());

-- listing_photos: public can read, only admins can write
drop policy if exists "listing_photos_public_read" on public.listing_photos;
create policy "listing_photos_public_read" on public.listing_photos
  for select using (true);

drop policy if exists "listing_photos_admin_write" on public.listing_photos;
create policy "listing_photos_admin_write" on public.listing_photos
  for all using (public.is_admin()) with check (public.is_admin());

-- registrations: anyone can submit (insert), only admins can read
drop policy if exists "registrations_public_insert" on public.registrations;
create policy "registrations_public_insert" on public.registrations
  for insert with check (true);

drop policy if exists "registrations_admin_read" on public.registrations;
create policy "registrations_admin_read" on public.registrations
  for select using (public.is_admin());

-- visitors: anyone can log a visit (insert), only admins can read
drop policy if exists "visitors_public_insert" on public.visitors;
create policy "visitors_public_insert" on public.visitors
  for insert with check (true);

drop policy if exists "visitors_admin_read" on public.visitors;
create policy "visitors_admin_read" on public.visitors
  for select using (public.is_admin());

-- admins table: only admins can see the allow-list (no public access at all)
drop policy if exists "admins_self_read" on public.admins;
create policy "admins_self_read" on public.admins
  for select using (public.is_admin());

-- ---------- Storage bucket for listing photos ----------
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

drop policy if exists "listing_photos_bucket_public_read" on storage.objects;
create policy "listing_photos_bucket_public_read" on storage.objects
  for select using (bucket_id = 'listing-photos');

drop policy if exists "listing_photos_bucket_admin_write" on storage.objects;
create policy "listing_photos_bucket_admin_write" on storage.objects
  for all using (bucket_id = 'listing-photos' and public.is_admin())
  with check (bucket_id = 'listing-photos' and public.is_admin());

-- ---------- Seed the sample listings (same data currently hardcoded in JS) ----------
insert into public.listings (title, location, type, status, price, beds, baths, area, created_at)
values
  ('Rumah Minimalis Green Valley', 'Bandung, Jawa Barat', 'Rumah', 'sale', 850000000, 3, 2, 90, '2026-08-20'),
  ('Apartemen Skyline Residence', 'Jakarta Selatan, DKI Jakarta', 'Apartemen', 'rent', 6500000, 2, 1, 45, '2026-09-10'),
  ('Ruko Strategis Jalan Utama', 'Surabaya, Jawa Timur', 'Ruko', 'sale', 1750000000, 0, 2, 120, '2026-07-02'),
  ('Tanah Kavling Siap Bangun', 'Bogor, Jawa Barat', 'Tanah', 'sale', 450000000, 0, 0, 200, '2026-06-15'),
  ('Rumah Modern Cluster Harmoni', 'Tangerang, Banten', 'Rumah', 'sale', 1250000000, 4, 3, 150, '2026-09-18'),
  ('Apartemen Studio Central Park', 'Jakarta Barat, DKI Jakarta', 'Apartemen', 'sale', 620000000, 1, 1, 32, '2026-05-28'),
  ('Rumah Asri Dekat Sekolah', 'Yogyakarta, DI Yogyakarta', 'Rumah', 'rent', 4200000, 2, 1, 70, '2026-08-02'),
  ('Ruko 3 Lantai Kawasan Bisnis', 'Medan, Sumatera Utara', 'Ruko', 'rent', 15000000, 0, 2, 180, '2026-04-11'),
  ('Tanah Komersial Pinggir Jalan Raya', 'Semarang, Jawa Tengah', 'Tanah', 'sale', 980000000, 0, 0, 300, '2026-09-01')
on conflict do nothing;

-- ---------- How to make yourself an admin ----------
-- 1. Go to Authentication > Users in the Supabase dashboard and add a user
--    (your own email + password) — this becomes your admin login.
-- 2. Copy that user's UID, then run:
--    insert into public.admins (user_id, email) values ('<paste-uid-here>', '<your-email>');
