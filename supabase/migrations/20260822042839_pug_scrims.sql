-- PUG Scrims: party queue, matchmaking, ELO, lobby handoff, result voting.
--
-- Matchmaking and result resolution touch many users' rows at once (other
-- players' queue entries, everyone's pug_elo) — that's inherently a
-- trusted server-side operation, not something any single player's RLS
-- session should be able to do. Those two operations run through the
-- service-role client (src/lib/supabase/service.ts), which bypasses RLS
-- entirely. Two BEFORE UPDATE triggers below backstop the columns that
-- must only ever change that way, even though the broader table-level
-- policies (e.g. "lobby maker can update their match") are looser.

alter table public.profiles add column pug_elo integer not null default 0;

create or replace function public.guard_pug_elo()
returns trigger
language plpgsql
as $$
begin
  if new.pug_elo is distinct from old.pug_elo and auth.role() <> 'service_role' then
    new.pug_elo := old.pug_elo;
  end if;
  return new;
end;
$$;

create trigger guard_pug_elo
  before update on public.profiles
  for each row
  execute function public.guard_pug_elo();

-- ---------------------------------------------------------------------
-- pug_parties / pug_party_members — party up before queueing. Same
-- invite/accept shape as team invites: leader invites a friend
-- ('invited'), invitee accepts ('active') or just deletes the row to
-- decline/leave.
-- ---------------------------------------------------------------------
create table public.pug_parties (
  id uuid primary key default gen_random_uuid(),
  leader_id uuid not null references public.profiles (id) on delete cascade,
  region text not null,
  created_at timestamptz not null default now()
);

alter table public.pug_parties enable row level security;

create policy "members read their party"
  on public.pug_parties
  for select
  to authenticated
  using (
    leader_id = auth.uid()
    or exists (
      select 1 from public.pug_party_members pm
      where pm.party_id = pug_parties.id and pm.user_id = auth.uid()
    )
  );

create policy "users create a party they lead"
  on public.pug_parties
  for insert
  to authenticated
  with check (leader_id = auth.uid());

create policy "leader updates their party"
  on public.pug_parties
  for update
  to authenticated
  using (leader_id = auth.uid())
  with check (leader_id = auth.uid());

create policy "leader disbands their party"
  on public.pug_parties
  for delete
  to authenticated
  using (leader_id = auth.uid());

create table public.pug_party_members (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.pug_parties (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'invited' check (status in ('invited', 'active')),
  joined_at timestamptz not null default now(),
  unique (party_id, user_id)
);

alter table public.pug_party_members enable row level security;

create policy "members read party roster"
  on public.pug_party_members
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.pug_parties p
      where p.id = pug_party_members.party_id and p.leader_id = auth.uid()
    )
  );

create policy "leader invites a member"
  on public.pug_party_members
  for insert
  to authenticated
  with check (
    status = 'invited'
    and exists (
      select 1 from public.pug_parties p
      where p.id = pug_party_members.party_id and p.leader_id = auth.uid()
    )
  );

create policy "invitee accepts their invite"
  on public.pug_party_members
  for update
  to authenticated
  using (user_id = auth.uid() and status = 'invited')
  with check (user_id = auth.uid() and status = 'active');

create policy "self leaves or leader removes a member"
  on public.pug_party_members
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.pug_parties p
      where p.id = pug_party_members.party_id and p.leader_id = auth.uid()
    )
  );

create or replace function public.handle_new_party()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pug_party_members (party_id, user_id, status)
  values (new.id, new.leader_id, 'active');
  return new;
end;
$$;

create trigger on_party_created
  after insert on public.pug_parties
  for each row
  execute function public.handle_new_party();

-- ---------------------------------------------------------------------
-- pug_matches / pug_match_players / pug_match_votes
-- ---------------------------------------------------------------------
create table public.pug_matches (
  id uuid primary key default gen_random_uuid(),
  region text not null,
  status text not null default 'lobby_pending' check (status in ('lobby_pending', 'in_progress', 'completed')),
  lobby_maker_id uuid not null references public.profiles (id),
  lobby_code text,
  winning_team smallint check (winning_team in (1, 2)),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

comment on table public.pug_matches is
  'A formed 6v6 PUG match. Created only by the service-role matchmaker, never directly by a player.';

alter table public.pug_matches enable row level security;

-- Participant-only, not public: lobby_code is on this row, and RLS can't
-- filter it out column-by-column. A future public results/leaderboard
-- view can select the non-sensitive columns explicitly.
create policy "match players read their match"
  on public.pug_matches
  for select
  to authenticated
  using (
    exists (
      select 1 from public.pug_match_players mp
      where mp.match_id = pug_matches.id and mp.user_id = auth.uid()
    )
  );

create policy "lobby maker posts the lobby code"
  on public.pug_matches
  for update
  to authenticated
  using (lobby_maker_id = auth.uid())
  with check (lobby_maker_id = auth.uid());

create or replace function public.guard_pug_match_integrity()
returns trigger
language plpgsql
as $$
begin
  if auth.role() <> 'service_role' then
    if new.winning_team is distinct from old.winning_team then
      new.winning_team := old.winning_team;
    end if;
    if new.status = 'completed' and old.status <> 'completed' then
      new.status := old.status;
    end if;
    if new.completed_at is distinct from old.completed_at then
      new.completed_at := old.completed_at;
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_pug_match_integrity
  before update on public.pug_matches
  for each row
  execute function public.guard_pug_match_integrity();

-- ---------------------------------------------------------------------
create table public.pug_match_players (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.pug_matches (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  team smallint not null check (team in (1, 2)),
  elo_before integer not null,
  elo_after integer,
  unique (match_id, user_id)
);

comment on table public.pug_match_players is 'Match rosters. Written only by the service-role matchmaker/resolver.';

alter table public.pug_match_players enable row level security;

create policy "match rosters are publicly readable"
  on public.pug_match_players
  for select
  to anon, authenticated
  using (true);

-- No insert/update/delete policy for authenticated: rosters are set once
-- by matchmaking and elo_after only by result resolution, both service-role.

-- ---------------------------------------------------------------------
create table public.pug_match_votes (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.pug_matches (id) on delete cascade,
  voter_id uuid not null references public.profiles (id),
  voted_team smallint not null check (voted_team in (1, 2)),
  created_at timestamptz not null default now(),
  unique (match_id, voter_id)
);

alter table public.pug_match_votes enable row level security;

create policy "votes are publicly readable"
  on public.pug_match_votes
  for select
  to anon, authenticated
  using (true);

create policy "match players vote once"
  on public.pug_match_votes
  for insert
  to authenticated
  with check (
    voter_id = auth.uid()
    and exists (
      select 1 from public.pug_match_players mp
      where mp.match_id = pug_match_votes.match_id and mp.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- pug_queue_entries — one row per solo player or party queueing together.
-- user_ids is a snapshot of who's included, taken at queue time.
-- ---------------------------------------------------------------------
create table public.pug_queue_entries (
  id uuid primary key default gen_random_uuid(),
  region text not null,
  leader_id uuid not null references public.profiles (id),
  party_id uuid references public.pug_parties (id) on delete set null,
  user_ids uuid[] not null,
  size smallint not null check (size between 1 and 6),
  elo numeric not null,
  status text not null default 'queued' check (status in ('queued', 'matched')),
  matched_into uuid references public.pug_matches (id),
  joined_at timestamptz not null default now(),
  check (array_length(user_ids, 1) = size)
);

comment on table public.pug_queue_entries is
  'The PUG queue. size > 1 means a party queueing together (kept intact on one team).';

alter table public.pug_queue_entries enable row level security;

create policy "queue entries are readable by signed-in users"
  on public.pug_queue_entries
  for select
  to authenticated
  using (true);

create policy "users queue themselves or their party"
  on public.pug_queue_entries
  for insert
  to authenticated
  with check (leader_id = auth.uid() and auth.uid() = any(user_ids));

create policy "leader cancels their queue entry"
  on public.pug_queue_entries
  for delete
  to authenticated
  using (leader_id = auth.uid());

-- No update policy for authenticated: only the service-role matchmaker
-- flips status to 'matched'.
