-- Profile social links (Discord already exists as discord_handle) and a
-- friends system.

alter table public.profiles
  add column youtube_url text,
  add column twitch_url text,
  add column statlocker_url text,
  add column x_url text,
  add column instagram_url text;

-- ---------------------------------------------------------------------
-- friendships — one row per pair, regardless of who sent the request.
-- Declining or cancelling a request just deletes the row; there's no
-- 'declined' status to keep around.
-- ---------------------------------------------------------------------
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);

comment on table public.friendships is
  'Friend requests and accepted friendships. One row per pair no matter who sent the request.';

-- One relationship per pair in either direction.
create unique index friendships_pair_unique
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

alter table public.friendships enable row level security;

create policy "accepted friendships are publicly readable"
  on public.friendships
  for select
  to anon, authenticated
  using (status = 'accepted');

create policy "pending requests are readable by the two parties"
  on public.friendships
  for select
  to authenticated
  using (status = 'pending' and (requester_id = auth.uid() or addressee_id = auth.uid()));

create policy "users send their own friend requests"
  on public.friendships
  for insert
  to authenticated
  with check (requester_id = auth.uid() and status = 'pending');

create policy "addressee accepts a pending request"
  on public.friendships
  for update
  to authenticated
  using (addressee_id = auth.uid() and status = 'pending')
  with check (addressee_id = auth.uid() and status = 'accepted');

create policy "either party removes the friendship"
  on public.friendships
  for delete
  to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());
