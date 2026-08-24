-- A real account ended up with 4 simultaneously "active" pug_parties
-- memberships. Root cause: createPartyAction's hasActiveParty() check
-- and the insert aren't atomic — two near-simultaneous requests (a
-- double-click, a retried request) can both pass the check before
-- either INSERT commits, each becoming its own party with the user as
-- an active leader. A partial unique index closes this at the only
-- level that can actually guarantee it: the second concurrent INSERT
-- now fails outright instead of silently succeeding.
create unique index pug_party_members_one_active_per_user
  on public.pug_party_members (user_id)
  where status = 'active';
