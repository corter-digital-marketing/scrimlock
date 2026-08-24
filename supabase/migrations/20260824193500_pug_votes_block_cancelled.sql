-- The vote insert/update policies added in pug_votes_changeable.sql
-- only excluded status = 'completed', not 'cancelled' — a live test
-- caught it: voting on a cancelled match wasn't actually blocked.
-- Positive check instead (only 'in_progress' can be voted on) so this
-- can't silently miss a future status value the same way again.
drop policy if exists "match players vote once" on public.pug_match_votes;

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
    and exists (
      select 1 from public.pug_matches m
      where m.id = pug_match_votes.match_id and m.status = 'in_progress'
    )
  );

drop policy if exists "voter changes their vote before the match resolves" on public.pug_match_votes;

create policy "voter changes their vote before the match resolves"
  on public.pug_match_votes
  for update
  to authenticated
  using (voter_id = auth.uid())
  with check (
    voter_id = auth.uid()
    and exists (
      select 1 from public.pug_matches m
      where m.id = pug_match_votes.match_id and m.status = 'in_progress'
    )
  );
