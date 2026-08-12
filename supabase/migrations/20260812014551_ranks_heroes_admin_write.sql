-- Follow-up to the Phase 1 ranks/heroes migration: now that `profiles`
-- (and profiles.is_admin) exists, grant admins write access instead of
-- leaving these tables service-role-only.

create policy "admins insert ranks"
  on public.ranks
  for insert
  to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "admins update ranks"
  on public.ranks
  for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "admins delete ranks"
  on public.ranks
  for delete
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "admins insert heroes"
  on public.heroes
  for insert
  to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "admins update heroes"
  on public.heroes
  for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "admins delete heroes"
  on public.heroes
  for delete
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
