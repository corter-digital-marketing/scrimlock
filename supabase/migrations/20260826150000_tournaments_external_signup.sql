-- Tournaments pivot from hosting registration on-site to just
-- advertising it: organizers post details and link out to wherever
-- they're actually running signups (Discord, a form, etc.).
alter table public.tournaments add column signup_url text;

-- No registration data exists yet (this table was never used by a real
-- tournament), so a straight drop is safe — see the git history for the
-- register/withdraw/confirm/reject flow this replaces.
drop table public.tournament_registrations;
