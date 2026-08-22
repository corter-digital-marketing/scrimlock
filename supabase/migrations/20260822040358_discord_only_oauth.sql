-- Auth is now Google + Discord only (no email/password, so no
-- password-reset flow to build or run). This updates the signup trigger
-- to also pre-fill discord_handle from the Discord identity when that's
-- how someone signed up, instead of leaving it for them to type in by
-- hand on /settings/profile.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate text;
  suffix int := 0;
  discord_username text;
begin
  base_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'));
  if base_username = '' then
    base_username := 'player';
  end if;
  base_username := left(base_username, 20);

  candidate := base_username;
  while exists (select 1 from public.profiles where username = candidate) loop
    suffix := suffix + 1;
    candidate := left(base_username, 20 - length(suffix::text) - 1) || '_' || suffix;
  end loop;

  if new.raw_app_meta_data ->> 'provider' = 'discord' then
    discord_username := coalesce(
      new.raw_user_meta_data -> 'custom_claims' ->> 'global_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    );
  end if;

  insert into public.profiles (id, username, display_name, avatar_url, discord_handle)
  values (
    new.id,
    candidate,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    discord_username
  );

  return new;
end;
$$;
