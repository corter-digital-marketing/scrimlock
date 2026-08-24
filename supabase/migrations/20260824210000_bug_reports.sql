-- Homepage "report a bug" form. Submittable while signed out on
-- purpose — a broken sign-in flow is exactly the kind of bug someone
-- needs to be able to report without first signing in to report it.
create table public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null,
  email text,
  message text not null check (char_length(message) between 1 and 2000),
  page_url text,
  created_at timestamptz not null default now()
);

comment on table public.bug_reports is
  'Homepage bug-report submissions. Readable only by admins (see profiles.is_admin).';

alter table public.bug_reports enable row level security;

create policy "anyone can report a bug"
  on public.bug_reports
  for insert
  to anon, authenticated
  -- Signed-in reporters can only attribute the report to themselves
  -- (or leave it anonymous) — not claim to be someone else.
  with check (reporter_id is null or reporter_id = auth.uid());

create policy "admins read bug reports"
  on public.bug_reports
  for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
