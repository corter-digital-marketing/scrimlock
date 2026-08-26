-- Same class of bug as guard_profile_privileges (previous migration):
-- "owner or captains update team" and "owner or captains manage
-- members" are blanket policies gated only on "is the actor currently
-- an owner/captain of this team," with no column restriction. Two
-- concrete escalation paths follow directly from that:
--
-- 1. teams.owner_id — a captain can call
--    .from('teams').update({ owner_id: <themselves> }).eq('id', teamId)
--    and it passes RLS outright (the actor genuinely is an active
--    captain), reassigning real ownership — including the DELETE right
--    on `teams`, which is gated on owner_id alone — to themselves.
--    This is a direct, unauthorized ownership theft, more severe than
--    the role_on_team issue below.
--
-- 2. team_members.role_on_team — the app's own action code already
--    appends `.neq("role_on_team", "owner")` when captains remove or
--    re-role members (src/lib/actions/teams.ts), which is the right
--    instinct, but that's a query-shape safety net in *application*
--    code, not an RLS restriction — anyone bypassing the app (a direct
--    Supabase client call with their own session, same technique as
--    the is_admin bug) skips it entirely. Three write paths, all
--    ungated on role_on_team itself: the UPDATE policy above lets a
--    captain set their own row's role_on_team to 'owner'; the INSERT
--    invite policy ("owner or captains invite a member") only checks
--    status = 'invited', not role_on_team, so a captain can insert a
--    brand-new 'owner' row for themselves or an accomplice; and
--    "invitee accepts their invite" only checks status, so even a
--    plain invited player can smuggle role_on_team = 'owner' into
--    their own accept-invite update.
--
-- Fixed with two guard triggers, same silent-revert idiom as
-- guard_pug_elo/guard_profile_privileges:
--
-- guard_team_owner_id: teams.owner_id can't change except via the
-- service role (no in-app ownership-transfer feature exists today; if
-- one ships later it goes through service-role or a dedicated path).
--
-- guard_team_member_owner_role: role_on_team can only ever equal
-- 'owner' on the one row whose user_id matches that team's *actual*
-- current owner_id — tying it to real ownership data rather than to
-- auth.role(), which matters because handle_new_team()'s legitimate
-- bootstrap insert (SECURITY DEFINER) still runs under the original
-- caller's JWT as far as auth.role()/auth.uid() are concerned, so a
-- naive "block unless service_role" check here would have broken
-- normal team creation. Also blocks anyone but the owner themselves
-- (or service_role) from modifying or deleting the owner's own row —
-- a captain shouldn't be able to demote or remove the person who
-- outranks them.

create or replace function public.guard_team_owner_id()
returns trigger
language plpgsql
as $$
begin
  if new.owner_id is distinct from old.owner_id and auth.role() <> 'service_role' then
    new.owner_id := old.owner_id;
  end if;
  return new;
end;
$$;

create trigger guard_team_owner_id
  before update on public.teams
  for each row
  execute function public.guard_team_owner_id();

create or replace function public.guard_team_member_owner_role()
returns trigger
language plpgsql
as $$
declare
  real_owner_id uuid;
begin
  if tg_op = 'DELETE' then
    if old.role_on_team = 'owner' and old.user_id <> auth.uid() and auth.role() <> 'service_role' then
      return null; -- silently skip: only the owner removes their own row
    end if;
    return old;
  end if;

  select owner_id into real_owner_id from public.teams where id = new.team_id;

  if tg_op = 'INSERT' then
    if new.role_on_team = 'owner' and new.user_id is distinct from real_owner_id then
      new.role_on_team := 'player';
    end if;
    return new;
  end if;

  -- UPDATE
  if old.role_on_team = 'owner' and old.user_id <> auth.uid() and auth.role() <> 'service_role' then
    return old; -- captains can't touch the owner's row at all
  end if;
  if new.role_on_team = 'owner' and new.user_id is distinct from real_owner_id then
    new.role_on_team := old.role_on_team; -- no self-promotion to owner
  end if;
  return new;
end;
$$;

create trigger guard_team_member_owner_role
  before insert or update or delete on public.team_members
  for each row
  execute function public.guard_team_member_owner_role();
