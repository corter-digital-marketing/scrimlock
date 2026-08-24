-- Lobby check-in: once the lobby code is posted, everyone has 5 minutes
-- to confirm they're actually in the custom lobby, or the match is
-- auto-cancelled (opportunistically, like matchmaking/resolution — see
-- tryExpireMatch, called from the match page same as tryFormMatch is
-- called from /pug).
alter table public.pug_matches
  add column lobby_opened_at timestamptz;

alter table public.pug_matches
  drop constraint pug_matches_status_check;

alter table public.pug_matches
  add constraint pug_matches_status_check
  check (status in ('lobby_pending', 'in_progress', 'completed', 'cancelled'));

alter table public.pug_match_players
  add column checked_in_at timestamptz;

-- Players had no update path onto their own roster row at all before
-- this (rosters were service-role-only, by design — see the table
-- comment above). Scope it narrowly: a player can update their own
-- row, but a guard trigger reverts anything other than checked_in_at
-- for non-service-role callers, same pattern as guard_pug_elo /
-- guard_pug_match_integrity.
create policy "player checks themself into the lobby"
  on public.pug_match_players
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.guard_pug_match_player_integrity()
returns trigger
language plpgsql
as $$
begin
  if auth.role() <> 'service_role' then
    if new.team is distinct from old.team then
      new.team := old.team;
    end if;
    if new.elo_before is distinct from old.elo_before then
      new.elo_before := old.elo_before;
    end if;
    if new.elo_after is distinct from old.elo_after then
      new.elo_after := old.elo_after;
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_pug_match_player_integrity
  before update on public.pug_match_players
  for each row
  execute function public.guard_pug_match_player_integrity();

-- ---------------------------------------------------------------------
-- pug_match_messages — a chat between the 12 players in a match, shown
-- between the two team panels. Polled the same way the rest of PUG
-- Scrims is (PugAutoRefresh), matching how direct messages work
-- elsewhere in the app — no realtime infra anywhere else to plug into.
-- ---------------------------------------------------------------------
create table public.pug_match_messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.pug_matches (id) on delete cascade,
  sender_id uuid not null references public.profiles (id),
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.pug_match_messages enable row level security;

create policy "match players read the match chat"
  on public.pug_match_messages
  for select
  to authenticated
  using (
    exists (
      select 1 from public.pug_match_players mp
      where mp.match_id = pug_match_messages.match_id and mp.user_id = auth.uid()
    )
  );

create policy "match players send chat messages"
  on public.pug_match_messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.pug_match_players mp
      where mp.match_id = pug_match_messages.match_id and mp.user_id = auth.uid()
    )
  );
