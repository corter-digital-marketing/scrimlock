-- Fix: "infinite recursion detected in policy for relation pug_parties".
--
-- pug_parties' "members read their party" policy checks pug_party_members
-- via EXISTS, and pug_party_members' "members read party roster" policy
-- checks pug_parties via EXISTS right back. Any SELECT on pug_parties by
-- a non-leader (or an INSERT ... RETURNING, which supabase-js's
-- .select() triggers) makes Postgres try to evaluate both tables' RLS
-- policies through each other with no base case, and it errors out
-- rather than loop forever. Caught by a live smoke test exercising
-- pug_parties, not by anything at build/dev time.
--
-- Fix: a SECURITY DEFINER helper that checks party membership as the
-- (RLS-bypassing) function owner instead of as the querying user, so
-- evaluating it doesn't re-trigger pug_party_members' own RLS. Same
-- pattern already used for the trigger functions below it.
create or replace function public.is_pug_party_member(p_party_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.pug_party_members pm
    where pm.party_id = p_party_id and pm.user_id = p_user_id
  );
$$;

drop policy if exists "members read their party" on public.pug_parties;

create policy "members read their party"
  on public.pug_parties
  for select
  to authenticated
  using (
    leader_id = auth.uid()
    or public.is_pug_party_member(id, auth.uid())
  );
