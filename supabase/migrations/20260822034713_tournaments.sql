-- Phase 6: tournaments and registrations.
--
-- Registering claims a slot immediately (status defaults 'pending' and
-- counts against max_participants, enforced in app logic). "Confirm" /
-- "reject" in the organizer's manage view is a moderation step on top of
-- that, not a gate on the slot itself — matching how the route plan
-- separates "register" from organizer "confirm registrations". Reject
-- reuses the 'withdrawn' status (the schema doesn't have a separate
-- "rejected" state); the UI still labels the organizer's button "Reject".

create type tournament_entry_type as enum ('solo', 'team');
create type tournament_status as enum ('draft', 'open', 'closed', 'in_progress', 'completed');
create type registration_status as enum ('pending', 'confirmed', 'withdrawn');

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organizer_id uuid not null references public.profiles (id),
  description text not null default '',
  format text,
  region text not null,
  prize_pool text,
  entry_type tournament_entry_type not null default 'solo',
  max_participants integer not null,
  min_rank_id smallint references public.ranks (id),
  max_rank_id smallint references public.ranks (id),
  starts_at timestamptz not null,
  registration_closes_at timestamptz not null,
  status tournament_status not null default 'draft',
  banner_url text,
  created_at timestamptz not null default now()
);

comment on table public.tournaments is
  'A tournament ("Fight Card"). Times are stored UTC; render in the viewer''s own timezone client-side.';

alter table public.tournaments enable row level security;

create policy "tournaments are publicly readable unless draft"
  on public.tournaments
  for select
  to anon, authenticated
  using (status <> 'draft' or organizer_id = auth.uid());

create policy "authed users create a tournament they organize"
  on public.tournaments
  for insert
  to authenticated
  with check (organizer_id = auth.uid());

create policy "organizer updates own tournament"
  on public.tournaments
  for update
  to authenticated
  using (organizer_id = auth.uid())
  with check (organizer_id = auth.uid());

create policy "organizer deletes own tournament"
  on public.tournaments
  for delete
  to authenticated
  using (organizer_id = auth.uid());

-- ---------------------------------------------------------------------
-- Exactly one of user_id / team_id is set per row (solo vs team entry),
-- matching entry_type on the tournament. The two partial-looking unique
-- constraints work because Postgres doesn't treat NULLs as equal, so
-- solo rows (team_id null) never collide on the team_id constraint and
-- vice versa.
-- ---------------------------------------------------------------------
create table public.tournament_registrations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  user_id uuid references public.profiles (id),
  team_id uuid references public.teams (id),
  status registration_status not null default 'pending',
  registered_at timestamptz not null default now(),
  unique (tournament_id, user_id),
  unique (tournament_id, team_id),
  check (
    (user_id is not null and team_id is null)
    or (user_id is null and team_id is not null)
  )
);

comment on table public.tournament_registrations is
  'A solo or team entry into a tournament.';

alter table public.tournament_registrations enable row level security;

create policy "registrations are publicly readable"
  on public.tournament_registrations
  for select
  to anon, authenticated
  using (true);

create policy "users register themselves solo"
  on public.tournament_registrations
  for insert
  to authenticated
  with check (user_id = auth.uid() and team_id is null);

create policy "owner or captains register their team"
  on public.tournament_registrations
  for insert
  to authenticated
  with check (
    user_id is null
    and team_id is not null
    and exists (
      select 1 from public.team_members tm
      where tm.team_id = tournament_registrations.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role_on_team in ('owner', 'captain')
    )
  );

create policy "organizer manages registrations"
  on public.tournament_registrations
  for update
  to authenticated
  using (
    exists (
      select 1 from public.tournaments t
      where t.id = tournament_registrations.tournament_id
        and t.organizer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.tournaments t
      where t.id = tournament_registrations.tournament_id
        and t.organizer_id = auth.uid()
    )
  );

create policy "solo registrant withdraws"
  on public.tournament_registrations
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and status = 'withdrawn');

create policy "owner or captains withdraw their team"
  on public.tournament_registrations
  for update
  to authenticated
  using (
    team_id is not null
    and exists (
      select 1 from public.team_members tm
      where tm.team_id = tournament_registrations.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role_on_team in ('owner', 'captain')
    )
  )
  with check (
    status = 'withdrawn'
    and exists (
      select 1 from public.team_members tm
      where tm.team_id = tournament_registrations.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role_on_team in ('owner', 'captain')
    )
  );
