/**
 * End-to-end smoke test against the LIVE Supabase project. Exercises the
 * real DB operations behind every server action (Teams, Friends,
 * Messages, Scrims, Tournaments, LFT, PUG Scrims matchmaking + ELO +
 * voting), using per-user authenticated clients so RLS is enforced
 * exactly as it is for real users. Creates its own throwaway test users
 * and deletes everything (including the users) at the end, success or
 * failure. First run of this caught a real "infinite recursion" RLS bug
 * between pug_parties/pug_party_members — see migration
 * 20260822043000_fix_pug_party_rls_recursion.sql.
 *
 * This imports pug-matchmaker.ts and pug-resolver.ts directly (the real
 * production matchmaking/ELO code, not a reimplementation), both of
 * which `import "server-only"` — that package unconditionally throws
 * outside Next.js's bundler (it relies on webpack/turbopack swapping it
 * per build target), so plain `npx tsx` on this file will crash with
 * "This module cannot be imported from a Client Component module."
 * Work around it before running:
 *
 *   cp node_modules/server-only/index.js node_modules/server-only/index.js.bak
 *   echo "module.exports = {};" > node_modules/server-only/index.js
 *   npx tsx scripts/smoke-test.ts
 *   mv node_modules/server-only/index.js.bak node_modules/server-only/index.js
 *
 * (node_modules isn't version-controlled, so this never touches the repo —
 * just don't skip the restore step, or server-only stops guarding
 * anything until the next `npm install`.)
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";
import { tryFormMatch } from "../src/lib/pug-matchmaker";
import { tryResolveMatch } from "../src/lib/pug-resolver";
import { eloDelta, applyEloDelta } from "../src/lib/pug-elo";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RUN_ID = Date.now().toString(36);

const admin = createClient<Database>(URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type TestUser = { id: string; email: string; username: string; client: SupabaseClient<Database> };

const results: { name: string; ok: boolean; detail?: string }[] = [];
function record(name: string, ok: boolean, detail?: string) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} — ${name}${detail ? ` (${detail})` : ""}`);
}
function assert(name: string, cond: unknown, detail?: string) {
  record(name, Boolean(cond), detail);
}

// Cleanup trackers
const teamIds: string[] = [];
const scrimIds: string[] = [];
const tournamentIds: string[] = [];
const matchIds: string[] = [];
const queueEntryIds: string[] = [];
const partyIds: string[] = [];
const conversationIds: string[] = [];
const friendshipIds: string[] = [];

async function makeUser(i: number, pugElo: number): Promise<TestUser> {
  const email = `smoke-${RUN_ID}-${i}@mailinator.com`;
  const password = "SmokeTest123";
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createUser ${i} failed: ${error?.message}`);

  const username = `smoke${RUN_ID}${i}`;
  const { error: profileError } = await admin
    .from("profiles")
    .update({ username, display_name: `Smoke ${i}`, pug_elo: pugElo })
    .eq("id", data.user.id);
  if (profileError) throw new Error(`profile update ${i} failed: ${profileError.message}`);

  const anon = createClient<Database>(URL, ANON_KEY);
  const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError || !signIn.session) {
    throw new Error(`signIn ${i} failed: ${signInError?.message}`);
  }

  const client = createClient<Database>(URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${signIn.session.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return { id: data.user.id, email, username, client };
}

async function main() {
  console.log(`\n=== Smoke test run ${RUN_ID} ===\n`);

  console.log("Creating 12 test users...");
  const elos = [1200, 900, 850, 1000, 1100, 950, 1050, 800, 750, 1150, 700, 650];
  const users: TestUser[] = [];
  for (let i = 0; i < 12; i++) {
    users.push(await makeUser(i, elos[i]));
  }
  const [u0, u1, u2, u3, u4, u5, u6, u7, u8, u9, u10, u11] = users;
  console.log(`Created: ${users.map((u) => u.username).join(", ")}\n`);

  // Verify the auto-profile-creation trigger actually ran (not something
  // this script did — we only updated the row, didn't insert it).
  {
    const { data } = await admin.from("profiles").select("id").eq("id", u0.id).maybeSingle();
    assert("profiles auto-created on signup (handle_new_user trigger)", Boolean(data));
  }

  // guard_profile_privileges: the blanket "users update their own
  // profile" policy has no column restriction, so is_admin needs its
  // own trigger the same way pug_elo does (tested further down) —
  // regression coverage for a real privilege-escalation bug fixed in
  // 20260826160000_guard_profile_is_admin.sql.
  {
    await u0.client.from("profiles").update({ is_admin: true }).eq("id", u0.id);
    const { data: check } = await admin.from("profiles").select("is_admin").eq("id", u0.id).single();
    assert(
      "guard_profile_privileges trigger blocks a player from self-granting is_admin",
      check?.is_admin === false,
    );
  }

  // ---------------------------------------------------------------
  // TEAMS
  // ---------------------------------------------------------------
  console.log("\n--- Teams ---");
  {
    const { data: team, error } = await u0.client
      .from("teams")
      .insert({ name: "Smoke Test Squad", tag: "SMK", region: "NA East", owner_id: u0.id })
      .select("id")
      .single();
    assert("owner creates a team", !error && !!team, error?.message);
    if (!team) throw new Error("team creation failed, aborting teams block");
    teamIds.push(team.id);

    const { data: ownerMember } = await admin
      .from("team_members")
      .select("role_on_team, status")
      .eq("team_id", team.id)
      .eq("user_id", u0.id)
      .maybeSingle();
    assert(
      "owner auto-added as active team_members row",
      ownerMember?.role_on_team === "owner" && ownerMember?.status === "active",
    );

    await u0.client.from("teams").update({ is_recruiting: true }).eq("id", team.id);

    const { error: joinErr } = await u1.client
      .from("team_members")
      .insert({ team_id: team.id, user_id: u1.id, role_on_team: "player", status: "pending" });
    assert("non-member requests to join a recruiting team", !joinErr, joinErr?.message);

    const { data: pendingRow } = await admin
      .from("team_members")
      .select("id")
      .eq("team_id", team.id)
      .eq("user_id", u1.id)
      .single();

    const { error: acceptErr } = await u0.client
      .from("team_members")
      .update({ status: "active" })
      .eq("id", pendingRow!.id)
      .eq("team_id", team.id);
    assert("owner accepts the join request", !acceptErr, acceptErr?.message);

    const { error: inviteErr } = await u0.client
      .from("team_members")
      .insert({ team_id: team.id, user_id: u2.id, role_on_team: "player", status: "invited" });
    assert("owner invites another player", !inviteErr, inviteErr?.message);

    const { error: inviteAcceptErr } = await u2.client
      .from("team_members")
      .update({ status: "active" })
      .eq("team_id", team.id)
      .eq("user_id", u2.id)
      .eq("status", "invited");
    assert("invitee accepts the invite", !inviteAcceptErr, inviteAcceptErr?.message);

    const { data: roster } = await admin
      .from("team_members")
      .select("user_id")
      .eq("team_id", team.id)
      .eq("status", "active");
    assert("roster has 3 active members (owner + join + invite)", roster?.length === 3);

    const { error: leaveErr } = await u1.client
      .from("team_members")
      .delete()
      .eq("team_id", team.id)
      .eq("user_id", u1.id)
      .eq("status", "active");
    assert("member leaves the team", !leaveErr, leaveErr?.message);

    const { data: rosterAfterLeave } = await admin
      .from("team_members")
      .select("user_id")
      .eq("team_id", team.id)
      .eq("status", "active");
    assert("roster drops to 2 after leaving", rosterAfterLeave?.length === 2);

    // RLS: an outsider shouldn't be able to update someone else's team.
    const { error: hijackErr } = await u5.client
      .from("teams")
      .update({ name: "Hijacked" })
      .eq("id", team.id);
    const { data: nameCheck } = await admin.from("teams").select("name").eq("id", team.id).single();
    assert(
      "RLS blocks a non-member from renaming the team",
      nameCheck?.name === "Smoke Test Squad",
      hijackErr?.message ?? "update silently no-opped (0 rows matched RLS)",
    );

    // guard_team_owner_id / guard_team_member_owner_role: the same
    // "blanket policy, no column restriction" bug as is_admin, but for
    // team ownership — regression coverage for
    // 20260826161500_guard_team_ownership.sql. u2 is promoted to
    // captain here to play the attacker.
    const { data: u2Member } = await admin
      .from("team_members")
      .select("id")
      .eq("team_id", team.id)
      .eq("user_id", u2.id)
      .single();
    await admin.from("team_members").update({ role_on_team: "captain" }).eq("id", u2Member!.id);

    await u2.client.from("teams").update({ owner_id: u2.id }).eq("id", team.id);
    const { data: ownerIdCheck } = await admin.from("teams").select("owner_id").eq("id", team.id).single();
    assert("captain can't steal teams.owner_id via direct update", ownerIdCheck?.owner_id === u0.id);

    await u2.client.from("team_members").update({ role_on_team: "owner" }).eq("id", u2Member!.id);
    const { data: roleCheck } = await admin
      .from("team_members")
      .select("role_on_team")
      .eq("id", u2Member!.id)
      .single();
    assert("captain can't self-promote role_on_team to owner", roleCheck?.role_on_team !== "owner");

    await u2.client
      .from("team_members")
      .insert({ team_id: team.id, user_id: u5.id, role_on_team: "owner", status: "invited" });
    const { data: accompliceRow } = await admin
      .from("team_members")
      .select("role_on_team")
      .eq("team_id", team.id)
      .eq("user_id", u5.id)
      .maybeSingle();
    assert(
      "captain can't insert a new 'owner' row for an accomplice",
      !accompliceRow || accompliceRow.role_on_team !== "owner",
    );

    const { data: ownerRow } = await admin
      .from("team_members")
      .select("id")
      .eq("team_id", team.id)
      .eq("user_id", u0.id)
      .single();
    await u2.client.from("team_members").delete().eq("id", ownerRow!.id);
    const { data: ownerStillThere } = await admin
      .from("team_members")
      .select("id")
      .eq("id", ownerRow!.id)
      .maybeSingle();
    assert("captain can't delete the owner's own team_members row", !!ownerStillThere);
  }

  // ---------------------------------------------------------------
  // FRIENDS
  // ---------------------------------------------------------------
  console.log("\n--- Friends ---");
  {
    const { data: friendship, error } = await u0.client
      .from("friendships")
      .insert({ requester_id: u0.id, addressee_id: u4.id })
      .select("id")
      .single();
    assert("send friend request", !error && !!friendship, error?.message);
    if (friendship) friendshipIds.push(friendship.id);

    const { error: acceptErr } = await u4.client
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendship!.id)
      .eq("addressee_id", u4.id);
    assert("addressee accepts friend request", !acceptErr, acceptErr?.message);

    const { data: check } = await admin
      .from("friendships")
      .select("status")
      .eq("id", friendship!.id)
      .single();
    assert("friendship status is accepted", check?.status === "accepted");

    const { error: dupErr } = await u0.client
      .from("friendships")
      .insert({ requester_id: u0.id, addressee_id: u4.id });
    assert("duplicate friend request rejected (unique constraint)", !!dupErr);
  }

  // ---------------------------------------------------------------
  // MESSAGES
  // ---------------------------------------------------------------
  console.log("\n--- Messages ---");
  {
    const [userAId, userBId] = u0.id < u4.id ? [u0.id, u4.id] : [u4.id, u0.id];
    const { data: convo, error: convoErr } = await u0.client
      .from("conversations")
      .insert({ user_a_id: userAId, user_b_id: userBId })
      .select("id")
      .single();
    assert("create conversation", !convoErr && !!convo, convoErr?.message);
    if (convo) conversationIds.push(convo.id);

    const { error: msgErr } = await u0.client
      .from("messages")
      .insert({ conversation_id: convo!.id, sender_id: u0.id, body: "hey, smoke test" });
    assert("send message", !msgErr, msgErr?.message);

    const { data: recipientRead, error: readErr } = await u4.client
      .from("messages")
      .select("body")
      .eq("conversation_id", convo!.id);
    assert("recipient can read the conversation", !readErr && recipientRead?.length === 1);

    const { data: outsiderRead } = await u5.client
      .from("messages")
      .select("body")
      .eq("conversation_id", convo!.id);
    assert("RLS blocks an outsider from reading the conversation", (outsiderRead?.length ?? 0) === 0);
  }

  // ---------------------------------------------------------------
  // SCRIMS
  // ---------------------------------------------------------------
  console.log("\n--- Scrims ---");
  {
    const scheduledFor = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    const { data: scrim, error } = await u0.client
      .from("scrims")
      .insert({
        posted_by: u0.id,
        team_id: teamIds[0],
        region: "NA East",
        scheduled_for: scheduledFor,
        notes: "smoke test scrim",
      })
      .select("id")
      .single();
    assert("post a scrim", !error && !!scrim, error?.message);
    if (scrim) scrimIds.push(scrim.id);

    const { data: response, error: respErr } = await u1.client
      .from("scrim_responses")
      .insert({ scrim_id: scrim!.id, responder_id: u1.id, message: "we'll play" })
      .select("id")
      .single();
    assert("another user responds to the scrim", !respErr && !!response, respErr?.message);

    const { error: acceptErr } = await u0.client
      .from("scrim_responses")
      .update({ status: "accepted" })
      .eq("id", response!.id);
    await u0.client.from("scrims").update({ status: "matched" }).eq("id", scrim!.id);
    assert("poster accepts the response", !acceptErr, acceptErr?.message);

    const { data: check } = await admin.from("scrims").select("status").eq("id", scrim!.id).single();
    assert("scrim status becomes matched", check?.status === "matched");
  }

  // ---------------------------------------------------------------
  // TOURNAMENTS
  // ---------------------------------------------------------------
  console.log("\n--- Tournaments ---");
  {
    const startsAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
    const closesAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 6).toISOString();
    const { data: tournament, error } = await u0.client
      .from("tournaments")
      .insert({
        title: "Smoke Test Open",
        organizer_id: u0.id,
        description: "smoke test",
        region: "NA",
        entry_type: "solo",
        max_participants: 8,
        starts_at: startsAt,
        registration_closes_at: closesAt,
        status: "draft",
      })
      .select("id")
      .single();
    assert("organizer creates a tournament", !error && !!tournament, error?.message);
    if (tournament) tournamentIds.push(tournament.id);

    const { error: openErr } = await u0.client
      .from("tournaments")
      .update({ status: "open", signup_url: "https://discord.gg/smoke-test" })
      .eq("id", tournament!.id);
    assert("organizer opens it and sets a signup link", !openErr, openErr?.message);

    const { data: signupCheck } = await admin
      .from("tournaments")
      .select("signup_url")
      .eq("id", tournament!.id)
      .single();
    assert("signup_url actually saved", signupCheck?.signup_url === "https://discord.gg/smoke-test");

    const { error: outsiderSignupErr } = await u5.client
      .from("tournaments")
      .update({ signup_url: "https://evil.example/hijacked" })
      .eq("id", tournament!.id);
    const { data: signupCheck2 } = await admin
      .from("tournaments")
      .select("signup_url")
      .eq("id", tournament!.id)
      .single();
    assert(
      "RLS blocks a non-organizer from changing the signup link",
      signupCheck2?.signup_url === "https://discord.gg/smoke-test",
      outsiderSignupErr?.message,
    );

    const { error: outsiderErr } = await u5.client
      .from("tournaments")
      .update({ status: "completed" })
      .eq("id", tournament!.id);
    const { data: statusCheck } = await admin
      .from("tournaments")
      .select("status")
      .eq("id", tournament!.id)
      .single();
    assert(
      "RLS blocks a non-organizer from changing tournament status",
      statusCheck?.status === "open",
      outsiderErr?.message,
    );
  }

  // ---------------------------------------------------------------
  // LFT
  // ---------------------------------------------------------------
  console.log("\n--- LFT ---");
  {
    const { error } = await u6.client
      .from("profiles")
      .update({ is_lft: true, region: "NA East", rank_id: 5 })
      .eq("id", u6.id);
    assert("player marks themself LFT", !error, error?.message);

    const { data: lftResults } = await admin
      .from("profiles")
      .select("id")
      .eq("is_lft", true)
      .eq("region", "NA East")
      .gte("rank_id", 0)
      .lte("rank_id", 11);
    assert(
      "LFT query (mirroring getLftPlayers) finds them",
      (lftResults ?? []).some((p) => p.id === u6.id),
    );
  }

  // ---------------------------------------------------------------
  // PUG SCRIMS — the main feature
  // ---------------------------------------------------------------
  console.log("\n--- PUG Scrims (matchmaking, ELO, lobby, voting) ---");
  {
    const region = `SmokeRegion-${RUN_ID}`; // isolated region so no other queue traffic interferes

    // Party: u2 leads, invites u3, u3 accepts.
    const { data: party, error: partyErr } = await u2.client
      .from("pug_parties")
      .insert({ leader_id: u2.id, region })
      .select("id")
      .single();
    assert("create a party", !partyErr && !!party, partyErr?.message);
    if (party) partyIds.push(party.id);

    const { error: inviteErr } = await u2.client
      .from("pug_party_members")
      .insert({ party_id: party!.id, user_id: u3.id, status: "invited" });
    assert("party leader invites a member", !inviteErr, inviteErr?.message);

    const { error: partyAcceptErr } = await u3.client
      .from("pug_party_members")
      .update({ status: "active" })
      .eq("party_id", party!.id)
      .eq("user_id", u3.id)
      .eq("status", "invited");
    assert("invitee accepts party invite", !partyAcceptErr, partyAcceptErr?.message);

    // Queue the party (u2 + u3), then 10 more solo entries -> 12 total.
    const partyElo = (elos[2] + elos[3]) / 2;
    const { data: partyQueueEntry, error: pqErr } = await u2.client
      .from("pug_queue_entries")
      .insert({
        region,
        leader_id: u2.id,
        party_id: party!.id,
        user_ids: [u2.id, u3.id],
        size: 2,
        elo: partyElo,
      })
      .select("id")
      .single();
    assert("queue the party", !pqErr && !!partyQueueEntry, pqErr?.message);
    if (partyQueueEntry) queueEntryIds.push(partyQueueEntry.id);

    const soloUsers = [u0, u1, u4, u5, u6, u7, u8, u9, u10, u11];
    for (const u of soloUsers) {
      const idx = users.indexOf(u);
      const { data: entry, error } = await u.client
        .from("pug_queue_entries")
        .insert({
          region,
          leader_id: u.id,
          party_id: null,
          user_ids: [u.id],
          size: 1,
          elo: elos[idx],
        })
        .select("id")
        .single();
      assert(`queue solo player ${u.username}`, !error && !!entry, error?.message);
      if (entry) queueEntryIds.push(entry.id);
    }

    // Run the real matchmaking algorithm (same function the server action calls).
    const matchId = await tryFormMatch(region);
    assert("tryFormMatch forms a match once 12 are queued", !!matchId);
    if (!matchId) throw new Error("no match formed, aborting PUG block");
    matchIds.push(matchId);

    const { data: matchPlayers } = await admin
      .from("pug_match_players")
      .select("*")
      .eq("match_id", matchId);
    assert("match has exactly 12 players", matchPlayers?.length === 12);

    const team1 = (matchPlayers ?? []).filter((p) => p.team === 1);
    const team2 = (matchPlayers ?? []).filter((p) => p.team === 2);
    assert("teams are split 6v6", team1.length === 6 && team2.length === 6);

    const partyMembersTogether =
      team1.some((p) => p.user_id === u2.id) === team1.some((p) => p.user_id === u3.id) &&
      team2.some((p) => p.user_id === u2.id) === team2.some((p) => p.user_id === u3.id);
    assert("party (u2 + u3) kept on the same team", partyMembersTogether);

    const { data: match } = await admin
      .from("pug_matches")
      .select("lobby_maker_id, status")
      .eq("id", matchId)
      .single();
    assert(
      "lobby maker is the highest-ELO player in the match (u0, 1200)",
      match?.lobby_maker_id === u0.id,
      `actual: ${match?.lobby_maker_id}`,
    );
    assert("match starts in lobby_pending", match?.status === "lobby_pending");

    // Queue entries should be consumed.
    const { data: leftoverQueued } = await admin
      .from("pug_queue_entries")
      .select("id")
      .eq("region", region)
      .eq("status", "queued");
    assert("no leftover queued entries in the region", (leftoverQueued?.length ?? 0) === 0);

    // Lobby maker posts the code.
    const lobbyMakerUser = users.find((u) => u.id === match!.lobby_maker_id)!;
    const { error: codeErr } = await lobbyMakerUser.client
      .from("pug_matches")
      .update({ lobby_code: "SMOKE-1234", status: "in_progress" })
      .eq("id", matchId);
    assert("lobby maker posts the lobby code", !codeErr, codeErr?.message);

    // RLS: a non-lobby-maker can't post the code.
    const someoneElse = users.find((u) => u.id !== match!.lobby_maker_id)!;
    await someoneElse.client
      .from("pug_matches")
      .update({ lobby_code: "HIJACKED", status: "in_progress" })
      .eq("id", matchId);
    const { data: codeCheck } = await admin
      .from("pug_matches")
      .select("lobby_code")
      .eq("id", matchId)
      .single();
    assert(
      "RLS blocks a non-lobby-maker from overwriting the lobby code",
      codeCheck?.lobby_code === "SMOKE-1234",
    );

    // Guard trigger: a player can't directly set their own pug_elo.
    const anyPlayer = users[0];
    const { data: eloBefore } = await admin
      .from("profiles")
      .select("pug_elo")
      .eq("id", anyPlayer.id)
      .single();
    await anyPlayer.client.from("profiles").update({ pug_elo: 999999 }).eq("id", anyPlayer.id);
    const { data: eloAfter } = await admin
      .from("profiles")
      .select("pug_elo")
      .eq("id", anyPlayer.id)
      .single();
    assert(
      "guard_pug_elo trigger blocks a player from self-editing pug_elo",
      eloAfter?.pug_elo === eloBefore?.pug_elo,
    );

    // Guard trigger: a player can't directly force winning_team/status.
    await lobbyMakerUser.client
      .from("pug_matches")
      .update({ winning_team: 1, status: "completed" })
      .eq("id", matchId);
    const { data: integrityCheck } = await admin
      .from("pug_matches")
      .select("winning_team, status")
      .eq("id", matchId)
      .single();
    assert(
      "guard_pug_match_integrity trigger blocks a client from forcing a win",
      integrityCheck?.winning_team === null && integrityCheck?.status === "in_progress",
    );

    // Voting: 7 of 12 vote team 1 (VOTES_TO_CONFIRM). tryResolveMatch runs
    // after every vote, same as voteAction — should only actually resolve
    // once the 7th vote lands.
    const voters = users.slice(0, 7);
    for (let i = 0; i < voters.length; i++) {
      const { error: voteErr } = await voters[i].client
        .from("pug_match_votes")
        .insert({ match_id: matchId, voter_id: voters[i].id, voted_team: 1 });
      assert(`vote ${i + 1}/7 for team 1 recorded`, !voteErr, voteErr?.message);
      await tryResolveMatch(matchId);

      if (i < 6) {
        const { data: notYet } = await admin
          .from("pug_matches")
          .select("status")
          .eq("id", matchId)
          .single();
        if (notYet?.status === "completed") {
          record(`match NOT resolved before vote ${i + 1}/7`, false, `resolved early after ${i + 1} votes`);
        }
      }
    }

    const { data: finalMatch } = await admin
      .from("pug_matches")
      .select("status, winning_team, completed_at")
      .eq("id", matchId)
      .single();
    assert("match resolves to completed after 7th vote", finalMatch?.status === "completed");
    assert("winning_team is 1", finalMatch?.winning_team === 1);
    assert("completed_at is set", !!finalMatch?.completed_at);

    // Verify ELO math against the real pug-elo.ts functions.
    const { data: finalPlayers } = await admin
      .from("pug_match_players")
      .select("*")
      .eq("match_id", matchId);
    const avg = (list: typeof finalPlayers, team: number) => {
      const filtered = (list ?? []).filter((p) => p.team === team);
      return filtered.reduce((s, p) => s + p.elo_before, 0) / filtered.length;
    };
    const avg1 = avg(finalPlayers, 1);
    const avg2 = avg(finalPlayers, 2);

    let eloMathOk = true;
    for (const p of finalPlayers ?? []) {
      const won = p.team === 1;
      const opponentAvg = p.team === 1 ? avg2 : avg1;
      const expectedDelta = eloDelta(p.elo_before, opponentAvg, won);
      const expectedElo = applyEloDelta(p.elo_before, expectedDelta);
      if (p.elo_after !== expectedElo) {
        eloMathOk = false;
        console.log(
          `  mismatch: user ${p.user_id} team ${p.team} before=${p.elo_before} expected=${expectedElo} actual=${p.elo_after}`,
        );
      }
    }
    assert("elo_after matches pug-elo.ts math for all 12 players", eloMathOk);

    let profilesUpdatedOk = true;
    for (const p of finalPlayers ?? []) {
      const { data: prof } = await admin
        .from("profiles")
        .select("pug_elo")
        .eq("id", p.user_id)
        .single();
      if (prof?.pug_elo !== p.elo_after) profilesUpdatedOk = false;
    }
    assert("profiles.pug_elo updated to match elo_after for all 12 players", profilesUpdatedOk);

    const winner = finalPlayers?.find((p) => p.team === 1);
    const loser = finalPlayers?.find((p) => p.team === 2);
    assert(
      "a winner's elo went up",
      !!winner && winner.elo_after! > winner.elo_before,
      `${winner?.elo_before} -> ${winner?.elo_after}`,
    );
    assert(
      "a loser's elo went down (or floored at 0)",
      !!loser && (loser.elo_after! < loser.elo_before || loser.elo_after === 0),
      `${loser?.elo_before} -> ${loser?.elo_after}`,
    );
  }

  // ---------------------------------------------------------------
  // RLS spot-check: unauthenticated write should fail
  // ---------------------------------------------------------------
  console.log("\n--- RLS: anonymous write ---");
  {
    const anon = createClient<Database>(URL, ANON_KEY);
    const { error } = await anon
      .from("teams")
      .insert({ name: "Anon Team", tag: "ANON", owner_id: u0.id });
    assert("anonymous (signed-out) insert is rejected", !!error, error?.message ?? "unexpectedly succeeded");
  }
}

/**
 * A first live run of this left 12 test users stranded — cleanup logged
 * "Deleted 12 test users" but the delete order was wrong:
 * pug_queue_entries.matched_into references pug_matches with no
 * cascade, so deleting pug_matches first (while the consumed queue
 * entries still point at it via matched_into) fails the whole
 * statement — and deleteUser doesn't throw on the resulting FK error,
 * it just returns an unchecked `error`, so cleanup claimed success
 * anyway. Queue entries have to go first. Check every delete's error
 * here and print it instead of assuming success either way.
 */
async function deleteTable(table: string, ids: string[]) {
  if (!ids.length) return;
  const { error } = await admin.from(table).delete().in("id", ids);
  if (error) console.warn(`  cleanup: failed to delete from ${table}: ${error.message}`);
}

async function cleanup() {
  console.log("\n=== Cleanup ===");
  await deleteTable("pug_queue_entries", queueEntryIds);
  await deleteTable("pug_matches", matchIds);
  await deleteTable("pug_parties", partyIds);
  await deleteTable("conversations", conversationIds);
  await deleteTable("friendships", friendshipIds);
  await deleteTable("scrims", scrimIds);
  await deleteTable("tournaments", tournamentIds);
  await deleteTable("teams", teamIds);

  const { data: usersToDelete } = await admin
    .from("profiles")
    .select("id, username")
    .like("username", `smoke${RUN_ID}%`);

  let deleted = 0;
  for (const u of usersToDelete ?? []) {
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) {
      console.warn(`  cleanup: failed to delete user ${u.username}: ${error.message}`);
    } else {
      deleted++;
    }
  }
  console.log(`Deleted ${deleted}/${usersToDelete?.length ?? 0} test users and their rows.`);
  if (deleted !== (usersToDelete?.length ?? 0)) {
    console.warn(
      "  Some test users are still in the project — check the warnings above and remove them manually.",
    );
  }
}

main()
  .catch((err) => {
    console.error("\nFATAL:", err);
    record("script completed without throwing", false, String(err));
  })
  .finally(async () => {
    await cleanup();
    const failed = results.filter((r) => !r.ok);
    console.log(`\n=== Summary: ${results.length - failed.length}/${results.length} passed ===`);
    if (failed.length) {
      console.log("\nFailures:");
      for (const f of failed) console.log(`  - ${f.name}${f.detail ? `: ${f.detail}` : ""}`);
      process.exitCode = 1;
    }
  });
