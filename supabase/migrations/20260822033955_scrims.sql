-- Phase 5: scrims (practice-match arrangements) and responses.

create type scrim_status as enum ('open', 'matched', 'cancelled');
create type scrim_response_status as enum ('pending', 'accepted', 'declined');

create table public.scrims (
  id uuid primary key default gen_random_uuid(),
  posted_by uuid not null references public.profiles (id),
  team_id uuid references public.teams (id) on delete set null,
  region text not null,
  min_rank_id smallint references public.ranks (id),
  max_rank_id smallint references public.ranks (id),
  scheduled_for timestamptz not null,
  notes text,
  status scrim_status not null default 'open',
  created_at timestamptz not null default now()
);

comment on table public.scrims is
  'A posted 6v6 practice-match slot ("Arrangement"). scheduled_for is stored UTC; render it in the viewer''s own timezone client-side.';

alter table public.scrims enable row level security;

create policy "scrims are publicly readable"
  on public.scrims
  for select
  to anon, authenticated
  using (true);

create policy "authed users post a scrim as themselves"
  on public.scrims
  for insert
  to authenticated
  with check (posted_by = auth.uid());

create policy "poster manages own scrim"
  on public.scrims
  for update
  to authenticated
  using (posted_by = auth.uid())
  with check (posted_by = auth.uid());

create policy "poster deletes own scrim"
  on public.scrims
  for delete
  to authenticated
  using (posted_by = auth.uid());

-- ---------------------------------------------------------------------
create table public.scrim_responses (
  id uuid primary key default gen_random_uuid(),
  scrim_id uuid not null references public.scrims (id) on delete cascade,
  responder_id uuid not null references public.profiles (id),
  team_id uuid references public.teams (id) on delete set null,
  message text,
  status scrim_response_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (scrim_id, responder_id)
);

comment on table public.scrim_responses is 'A reply to a scrim post, offering to play.';

alter table public.scrim_responses enable row level security;

create policy "poster and responder read a response"
  on public.scrim_responses
  for select
  to authenticated
  using (
    responder_id = auth.uid()
    or exists (
      select 1 from public.scrims s
      where s.id = scrim_responses.scrim_id and s.posted_by = auth.uid()
    )
  );

create policy "authed users respond as themselves"
  on public.scrim_responses
  for insert
  to authenticated
  with check (responder_id = auth.uid());

create policy "poster accepts or declines responses"
  on public.scrim_responses
  for update
  to authenticated
  using (
    exists (
      select 1 from public.scrims s
      where s.id = scrim_responses.scrim_id and s.posted_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.scrims s
      where s.id = scrim_responses.scrim_id and s.posted_by = auth.uid()
    )
  );

create policy "responder withdraws own response"
  on public.scrim_responses
  for delete
  to authenticated
  using (responder_id = auth.uid());
