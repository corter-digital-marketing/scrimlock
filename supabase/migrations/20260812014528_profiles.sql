-- Phase 2: profiles — one row per user, created automatically on signup.
--
-- `region` and `timezone` are read as required-looking fields in the data
-- model (§3), but signup itself only collects email + password (or a
-- Google identity) — there's no profile-setup step yet. Both columns are
-- nullable here and get filled in once /settings/profile ships; treat that
-- as a known gap, not a design decision to leave them empty long-term.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text not null,
  avatar_url text,
  bio text,
  discord_handle text,
  region text,
  timezone text,
  rank_id smallint references public.ranks (id),
  rank_subrank smallint check (rank_subrank between 1 and 6),
  preferred_heroes uuid[] not null default '{}',
  playstyle_note text,
  is_lft boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per user (auth.users), auto-created by handle_new_user() on signup.';

alter table public.profiles enable row level security;

create policy "profiles are publicly readable"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

create policy "users insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Auto-create a profile row when a new auth user is created (email
-- signup or OAuth). SECURITY DEFINER so it can write to `profiles`
-- regardless of the (not-yet-authenticated-in-context) caller; the
-- pinned search_path avoids search-path hijacking in a definer function.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate text;
  suffix int := 0;
begin
  base_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'));
  if base_username = '' then
    base_username := 'player';
  end if;
  base_username := left(base_username, 20);

  candidate := base_username;
  while exists (select 1 from public.profiles where username = candidate) loop
    suffix := suffix + 1;
    candidate := left(base_username, 20 - length(suffix::text) - 1) || '_' || suffix;
  end loop;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    candidate,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
