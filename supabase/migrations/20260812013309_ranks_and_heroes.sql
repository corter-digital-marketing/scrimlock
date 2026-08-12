-- Phase 1: reference tables for the ranked ladder and hero roster.
--
-- Both tables are public reference data: readable by anyone (including
-- signed-out visitors browsing tournaments/scrims), writable by nobody yet.
-- Neither table has an insert/update/delete policy, and RLS denies by
-- default when no policy matches — so writes currently require the
-- service role key (server-only). Once Phase 2 creates `profiles` with an
-- `is_admin` flag, a follow-up migration adds admin write policies here
-- instead of loosening this file.

-- ---------------------------------------------------------------------
-- ranks — ordered reference, low -> high by id. 0 = Obscurus (placement),
-- 1-11 = the calibrated ladder. Each rank has 6 subranks (I-VI), tracked
-- per-profile later (profiles.rank_subrank), not modeled here.
-- ---------------------------------------------------------------------
create table public.ranks (
  id smallint primary key,
  name text not null unique,
  is_placement boolean not null default false
);

comment on table public.ranks is
  'Ordered reference list of the Deadlock ranked ladder (post July 30 2026 rename), low to high by id.';

alter table public.ranks enable row level security;

create policy "ranks are publicly readable"
  on public.ranks
  for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------
-- heroes — admin-editable roster reference. Seeded once below; Valve
-- adds/removes heroes over time, so this is a table, not a UI constant.
-- ---------------------------------------------------------------------
create table public.heroes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.heroes is
  'Admin-editable Deadlock hero roster. Seeded from the current lineup; edited in place as heroes are added or removed.';

alter table public.heroes enable row level security;

create policy "heroes are publicly readable"
  on public.heroes
  for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------
-- Seed: ranks, in ascending order.
-- ---------------------------------------------------------------------
insert into public.ranks (id, name, is_placement) values
  (0, 'Obscurus', true),
  (1, 'Initiate', false),
  (2, 'Seeker', false),
  (3, 'Acolyte', false),
  (4, 'Sentinel', false),
  (5, 'Mystic', false),
  (6, 'Ritualist', false),
  (7, 'Emissary', false),
  (8, 'Oracle', false),
  (9, 'Phantom', false),
  (10, 'Ascendant', false),
  (11, 'Eternus', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Seed: current hero roster (38 heroes, per deadlock.wiki as of Aug 2026).
-- ---------------------------------------------------------------------
insert into public.heroes (name) values
  ('Abrams'),
  ('Apollo'),
  ('Bebop'),
  ('Billy'),
  ('Calico'),
  ('Celeste'),
  ('The Doorman'),
  ('Drifter'),
  ('Dynamo'),
  ('Graves'),
  ('Grey Talon'),
  ('Haze'),
  ('Holliday'),
  ('Infernus'),
  ('Ivy'),
  ('Kelvin'),
  ('Lady Geist'),
  ('Lash'),
  ('McGinnis'),
  ('Mina'),
  ('Mirage'),
  ('Mo & Krill'),
  ('Paige'),
  ('Paradox'),
  ('Pocket'),
  ('Rem'),
  ('Seven'),
  ('Shiv'),
  ('Silver'),
  ('Sinclair'),
  ('Venator'),
  ('Victor'),
  ('Vindicta'),
  ('Viscous'),
  ('Vyper'),
  ('Warden'),
  ('Wraith'),
  ('Yamato')
on conflict (name) do nothing;
