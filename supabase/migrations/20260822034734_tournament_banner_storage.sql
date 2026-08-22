-- Public tournament banner storage. Files are keyed by
-- `<tournament_id>/<filename>`; writes are restricted to the organizer.

insert into storage.buckets (id, name, public)
values ('tournament-banners', 'tournament-banners', true)
on conflict (id) do nothing;

create policy "tournament banners are publicly accessible"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'tournament-banners');

create policy "organizer uploads tournament banner"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'tournament-banners'
    and exists (
      select 1 from public.tournaments t
      where t.id = (storage.foldername(name))[1]::uuid
        and t.organizer_id = auth.uid()
    )
  );

create policy "organizer updates tournament banner"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'tournament-banners'
    and exists (
      select 1 from public.tournaments t
      where t.id = (storage.foldername(name))[1]::uuid
        and t.organizer_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'tournament-banners'
    and exists (
      select 1 from public.tournaments t
      where t.id = (storage.foldername(name))[1]::uuid
        and t.organizer_id = auth.uid()
    )
  );

create policy "organizer deletes tournament banner"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'tournament-banners'
    and exists (
      select 1 from public.tournaments t
      where t.id = (storage.foldername(name))[1]::uuid
        and t.organizer_id = auth.uid()
    )
  );
