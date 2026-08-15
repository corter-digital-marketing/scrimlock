-- Public team logo storage. Files are keyed by `<team_id>/<filename>`;
-- writes are restricted to that team's owner/captain.

insert into storage.buckets (id, name, public)
values ('team-logos', 'team-logos', true)
on conflict (id) do nothing;

create policy "team logos are publicly accessible"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'team-logos');

create policy "owner or captains upload team logo"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'team-logos'
    and exists (
      select 1 from public.team_members tm
      where tm.team_id = (storage.foldername(name))[1]::uuid
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role_on_team in ('owner', 'captain')
    )
  );

create policy "owner or captains update team logo"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'team-logos'
    and exists (
      select 1 from public.team_members tm
      where tm.team_id = (storage.foldername(name))[1]::uuid
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role_on_team in ('owner', 'captain')
    )
  )
  with check (
    bucket_id = 'team-logos'
    and exists (
      select 1 from public.team_members tm
      where tm.team_id = (storage.foldername(name))[1]::uuid
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role_on_team in ('owner', 'captain')
    )
  );

create policy "owner or captains delete team logo"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'team-logos'
    and exists (
      select 1 from public.team_members tm
      where tm.team_id = (storage.foldername(name))[1]::uuid
        and tm.user_id = auth.uid()
        and tm.status = 'active'
        and tm.role_on_team in ('owner', 'captain')
    )
  );
