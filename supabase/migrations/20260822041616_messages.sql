-- Direct messages — one conversation per pair of users (1:1 only, no
-- group chat). Backs "message them directly on the website" for LFT,
-- team captains, and scrim arrangements. No realtime subscription here;
-- the UI polls lightly while a thread is open. Upgrading to Supabase
-- Realtime later is a reasonable follow-up, not required for this to work.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  -- Canonical ordering (user_a_id < user_b_id) so there's exactly one
  -- conversation per pair no matter who messages first.
  user_a_id uuid not null references public.profiles (id) on delete cascade,
  user_b_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_a_id, user_b_id),
  check (user_a_id < user_b_id)
);

comment on table public.conversations is 'One row per pair of users who have ever messaged.';

alter table public.conversations enable row level security;

create policy "participants read their conversation"
  on public.conversations
  for select
  to authenticated
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

create policy "users start a conversation they are part of"
  on public.conversations
  for insert
  to authenticated
  with check (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- ---------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id),
  body text not null,
  created_at timestamptz not null default now()
);

comment on table public.messages is 'Messages within a conversation.';

alter table public.messages enable row level security;

create policy "participants read messages in their conversation"
  on public.messages
  for select
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
    )
  );

create policy "participants send messages as themselves"
  on public.messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
    )
  );
