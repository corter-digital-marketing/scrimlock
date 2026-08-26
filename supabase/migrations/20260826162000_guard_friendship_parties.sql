-- "addressee accepts a pending request" only constrains addressee_id
-- and status in its WITH CHECK — requester_id is unconstrained, so the
-- addressee could accept-and-hijack a pending request by also setting
-- requester_id to a third party, fabricating an "accepted" friendship
-- that third party never consented to (lower impact than the other
-- guards — no private data exposure, just a fabricated relationship
-- row — but the same class of gap, and just as cheap to close).

create or replace function public.guard_friendship_parties()
returns trigger
language plpgsql
as $$
begin
  if auth.role() <> 'service_role' then
    if new.requester_id is distinct from old.requester_id then
      new.requester_id := old.requester_id;
    end if;
    if new.addressee_id is distinct from old.addressee_id then
      new.addressee_id := old.addressee_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_friendship_parties
  before update on public.friendships
  for each row
  execute function public.guard_friendship_parties();
