-- Votes were insert-only — an accidental click locked a player's vote
-- in permanently. Allow changing a vote up until the match actually
-- resolves (win/ELO is applied the moment the deciding vote lands, so
-- nothing after that point should still be editable).

create policy "voter changes their vote before the match resolves"
  on public.pug_match_votes
  for update
  to authenticated
  using (voter_id = auth.uid())
  with check (
    voter_id = auth.uid()
    and exists (
      select 1 from public.pug_matches m
      where m.id = pug_match_votes.match_id and m.status <> 'completed'
    )
  );

-- Same "not already completed" guard on the original insert path, for
-- the same reason postLobbyCodeAction etc. defend in depth server-side
-- even though the UI already hides the vote panel once a match is done.
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
      where m.id = pug_match_votes.match_id and m.status <> 'completed'
    )
  );
