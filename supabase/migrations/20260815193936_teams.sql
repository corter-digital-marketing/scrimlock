-- Phase 3: teams and rosters.
--
-- Deviation from §3 worth flagging: `team_members` gets a `status` column
-- ('pending' | 'active') that isn't in the original spec. The route plan
-- calls for "request to join" + owner/captain management, which needs
-- *something* to represent an unapproved request — without it, "request to
-- join" could only mean instant self-service joining, which defeats the
-- point of a recruiting team screening who joins. Everything else matches
-- §3 as written.

create type team_role as enum ('owner', 'captain', 'player', 'sub');

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tag text not null,
  region text,
  logo_url text,
  description text,
  owner_id uuid not null references public.profiles (id),
  is_recruiting boolean not null default false,
  recruiting_note text,
  created_at timestamptz not null default now()
);

comment on table public.teams is 'A roster-owning team ("Syndicate"). One profile can own many teams.';

alter table public.teams enable row level security;

create policy "teams are publicly readable"
  on public.teams
  for select
  to anon, authenticated
  using (true);

create policy "authed users create a team they own"
  on public.teams
  for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "owner deletes team"
  on public.teams
  for delete
  to authenticated
  using (owner_id = auth.uid());

-- ---------------------------------------------------------------------
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_on_team team_role not null default 'player',
  status text not null default 'active' check (status in ('pending', 'active')),
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);

comment on table public.team_members is
  'Roster + pending join requests. Max 6 active non-sub members is enforced in app logic, not here.';

alter table public.team_members enable row level security;

create policy "team members are publicly readable"
  on public.team_members
  for select
  to anon, authenticated
  using (true);

-- A user can only ever self-insert a *request* — pending, plain player.
-- Becoming active, a captain, or an owner requires an owner/captain to
-- approve (see UPDATE policy) or the bootstrap trigger below.
create policy "users request to join as a pending player"
  on public.team_members
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and role_on_team = 'player'
  );

create policy "owner or captains manage members"
  on public.team_members
  for update
  to authenticated
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = team_members.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role_on_team in ('owner', 'captain')
    )
  )
  with check (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = team_members.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role_on_team in ('owner', 'captain')
    )
  );

create policy "owner or captains remove members"
  on public.team_members
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = team_members.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role_on_team in ('owner', 'captain')
    )
  );

create policy "users remove themselves"
  on public.team_members
  for delete
  to authenticated
  using (user_id = auth.uid());

-- This has to come after team_members exists (it's referenced in the
-- USING/WITH CHECK subquery, and Postgres validates that at CREATE POLICY
-- time) — everything else on `teams` was defined right after that table.
create policy "owner or captains update team"
  on public.teams
  for update
  to authenticated
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = teams.id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role_on_team in ('owner', 'captain')
    )
  )
  with check (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = teams.id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role_on_team in ('owner', 'captain')
    )
  );

-- ---------------------------------------------------------------------
-- Bootstrap: creating a team auto-seats its owner as an active member.
-- SECURITY DEFINER because the plain self-insert policy above only
-- permits a pending/player row, not an active/owner one.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_team()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.team_members (team_id, user_id, role_on_team, status)
  values (new.id, new.owner_id, 'owner', 'active');
  return new;
end;
$$;

create trigger on_team_created
  after insert on public.teams
  for each row
  execute function public.handle_new_team();
