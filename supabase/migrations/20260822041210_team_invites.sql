-- Team invites — the reverse of "request to join": an owner/captain
-- invites a specific user (their friend, in the UI) directly, and that
-- user accepts or declines. Adds a third team_members status: 'invited'
-- (distinct from 'pending', which is a self-initiated join request).

alter table public.team_members drop constraint team_members_status_check;
alter table public.team_members
  add constraint team_members_status_check
  check (status in ('pending', 'invited', 'active'));

create policy "owner or captains invite a member"
  on public.team_members
  for insert
  to authenticated
  with check (
    status = 'invited'
    and exists (
      select 1 from public.team_members tm
      where tm.team_id = team_members.team_id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role_on_team in ('owner', 'captain')
    )
  );

create policy "invitee accepts their invite"
  on public.team_members
  for update
  to authenticated
  using (user_id = auth.uid() and status = 'invited')
  with check (user_id = auth.uid() and status = 'active');

-- Declining an invite reuses the existing "users remove themselves"
-- delete policy — it's a plain `user_id = auth.uid()` check regardless
-- of status, so no new policy is needed for that half.
