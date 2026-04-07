-- Supabase schema + RLS baseline for Civic Hub
-- Run this in Supabase SQL editor as the postgres/admin role.

-- Extensions (often already enabled)
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Utility trigger for updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- COMMUNITY PROFILES -------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid default auth.uid(), -- when using Supabase Auth; NULL if anonymous

  display_name text not null,
  full_name text,
  bio text,
  is_public boolean not null default true,

  district text,
  city text,
  state text,
  country text,

  photo_url text,

  -- public-facing contact info ONLY (never private)
  public_email text,
  public_phone text,
  public_website text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_display_name_key
  on public.profiles (lower(display_name));

create trigger profiles_updated_at
before update on public.profiles
for each row
execute procedure public.set_updated_at();

alter table public.profiles enable row level security;

-- Read: public profiles readable by everyone (public feed)
create policy if not exists "public profiles readable"
  on public.profiles
  for select
  using (is_public);

-- Read: owners can see their own even if private (requires auth)
create policy if not exists "owners can read private profiles"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Insert: anyone can create a profile (must be public)
create policy if not exists "anyone can insert public profiles"
  on public.profiles
  for insert
  using (true)
  with check (is_public);

-- Update: only owners can update (requires auth)
create policy if not exists "owners can update their profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Delete: only owners can delete (requires auth)
create policy if not exists "owners can delete their profile"
  on public.profiles
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- PROFILE PHOTOS (Storage) -------------------------------------------------
insert into storage.buckets (id, name, public)
values ('profile_photos', 'profile_photos', true)
on conflict (id) do nothing;

-- Read: anyone can view profile photos
create policy if not exists "public read access to profile photos"
  on storage.objects
  for select
  using (bucket_id = 'profile_photos');

-- Upload: only authenticated users can upload photos
create policy if not exists "authenticated users can upload profile photos"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'profile_photos');

-- Tighten this however you like once your auth model is final.
