-- CRITICAL: "users update their own profile" (20260812014528_profiles.sql)
-- is a blanket row-level policy — `using/with check (auth.uid() = id)` —
-- with no column restriction. Postgres RLS is row-level, not
-- column-level, so that policy alone lets any authenticated user run
-- `update profiles set is_admin = true where id = auth.uid()` directly
-- through the Supabase client (the anon-key client already loaded in
-- every visitor's browser), bypassing the UI entirely and granting
-- themselves admin — including read access to every bug_reports row
-- (reporter emails included) and every admin-only write path.
--
-- pug_elo already gets exactly this treatment via guard_pug_elo
-- (20260822042839_pug_scrims.sql) for the same reason: a privileged
-- column can't safely sit inside a blanket per-user update policy.
-- is_admin is the single most sensitive column in the schema and was
-- missing the same guard — this closes that gap the same way.
--
-- created_at is included too, at zero extra cost, so a user can't
-- backdate their own account.

create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
as $$
begin
  if auth.role() <> 'service_role' then
    if new.is_admin is distinct from old.is_admin then
      new.is_admin := old.is_admin;
    end if;
    if new.created_at is distinct from old.created_at then
      new.created_at := old.created_at;
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_profile_privileges
  before update on public.profiles
  for each row
  execute function public.guard_profile_privileges();
