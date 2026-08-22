"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createTeamSchema, updateTeamSchema } from "@/lib/validations/team";
import { MAX_ACTIVE_ROSTER } from "@/lib/teams";
import type { TeamRole } from "@/lib/supabase/database.types";

export type TeamActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

/** Result shape for the small one-click actions (join/leave/accept/etc). */
export type SimpleActionResult = { error?: string } | void;

const NOT_CONFIGURED_ERROR =
  "This site isn't connected to a backend yet — add Supabase credentials to .env.local (see README).";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

async function getRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamId: string,
  userId: string,
): Promise<TeamRole | null> {
  const { data } = await supabase
    .from("team_members")
    .select("role_on_team")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  return data?.role_on_team ?? null;
}

async function countActiveNonSub(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamId: string,
  excludeMemberId?: string,
) {
  const { data } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("status", "active")
    .neq("role_on_team", "sub");

  return (data ?? []).filter((m) => m.id !== excludeMemberId).length;
}

async function uploadLogo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamId: string,
  logo: File,
) {
  const ext = logo.name.split(".").pop() || "png";
  const path = `${teamId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("team-logos")
    .upload(path, logo, { contentType: logo.type, upsert: true });
  if (error) return null;
  return supabase.storage.from("team-logos").getPublicUrl(path).data.publicUrl;
}

export async function createTeamAction(
  _prevState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const { supabase, user } = await requireUser();
  if (!user) redirect("/login?next=/teams/new");

  const logoFile = formData.get("logo");
  const parsed = createTeamSchema.safeParse({
    name: formData.get("name"),
    tag: formData.get("tag"),
    region: formData.get("region") || undefined,
    description: formData.get("description") || undefined,
    logo: logoFile instanceof File && logoFile.size > 0 ? logoFile : undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      name: parsed.data.name,
      tag: parsed.data.tag.toUpperCase(),
      region: parsed.data.region || null,
      description: parsed.data.description || null,
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (error || !team) {
    return { error: "Couldn't create the team. Please try again." };
  }

  if (parsed.data.logo) {
    const logoUrl = await uploadLogo(supabase, team.id, parsed.data.logo);
    if (logoUrl) {
      await supabase.from("teams").update({ logo_url: logoUrl }).eq("id", team.id);
    }
  }

  redirect(`/teams/${team.id}`);
}

export async function updateTeamAction(
  _prevState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const teamId = formData.get("teamId");
  if (typeof teamId !== "string") return { error: "Missing team." };

  const { supabase, user } = await requireUser();
  if (!user) redirect(`/login?next=/teams/${teamId}/manage`);

  const role = await getRole(supabase, teamId, user.id);
  if (role !== "owner" && role !== "captain") {
    return { error: "Only the owner or a captain can edit this team." };
  }

  const logoFile = formData.get("logo");
  const parsed = updateTeamSchema.safeParse({
    name: formData.get("name"),
    tag: formData.get("tag"),
    region: formData.get("region") || undefined,
    description: formData.get("description") || undefined,
    logo: logoFile instanceof File && logoFile.size > 0 ? logoFile : undefined,
    isRecruiting: formData.get("isRecruiting") === "on",
    recruitingNote: formData.get("recruitingNote") || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let logoUrl: string | undefined;
  if (parsed.data.logo) {
    const uploaded = await uploadLogo(supabase, teamId, parsed.data.logo);
    if (uploaded) logoUrl = uploaded;
  }

  const { error } = await supabase
    .from("teams")
    .update({
      name: parsed.data.name,
      tag: parsed.data.tag.toUpperCase(),
      region: parsed.data.region || null,
      description: parsed.data.description || null,
      is_recruiting: parsed.data.isRecruiting,
      recruiting_note: parsed.data.recruitingNote || null,
      ...(logoUrl ? { logo_url: logoUrl } : {}),
    })
    .eq("id", teamId);

  if (error) {
    return { error: "Couldn't save the team. Please try again." };
  }

  redirect(`/teams/${teamId}`);
}

export async function requestToJoinAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const teamId = formData.get("teamId");
  if (typeof teamId !== "string") return { error: "Missing team." };

  const { supabase, user } = await requireUser();
  if (!user) redirect(`/login?next=/teams/${teamId}`);

  const { data: team } = await supabase
    .from("teams")
    .select("is_recruiting")
    .eq("id", teamId)
    .maybeSingle();

  if (!team?.is_recruiting) {
    return { error: "This team isn't recruiting right now." };
  }

  const existing = await getRole(supabase, teamId, user.id);
  if (existing) return { error: "You're already on this team." };

  const { error } = await supabase.from("team_members").insert({
    team_id: teamId,
    user_id: user.id,
    role_on_team: "player",
    status: "pending",
  });

  if (error) {
    return error.code === "23505"
      ? { error: "You've already requested to join." }
      : { error: "Couldn't send the request. Please try again." };
  }

  revalidatePath(`/teams/${teamId}`);
}

export async function cancelJoinRequestAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const teamId = formData.get("teamId");
  if (typeof teamId !== "string") return { error: "Missing team." };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .eq("status", "pending");

  revalidatePath(`/teams/${teamId}`);
}

export async function leaveTeamAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const teamId = formData.get("teamId");
  if (typeof teamId !== "string") return { error: "Missing team." };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  const role = await getRole(supabase, teamId, user.id);
  if (role === "owner") {
    return { error: "Owners can't leave — delete the team instead." };
  }

  await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .eq("status", "active");

  revalidatePath(`/teams/${teamId}`);
}

export async function acceptRequestAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const teamId = formData.get("teamId");
  const memberId = formData.get("memberId");
  if (typeof teamId !== "string" || typeof memberId !== "string") {
    return { error: "Missing team or member." };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  const role = await getRole(supabase, teamId, user.id);
  if (!role || (role !== "owner" && role !== "captain")) {
    return { error: "Only the owner or a captain can approve requests." };
  }

  const activeCount = await countActiveNonSub(supabase, teamId);
  if (activeCount >= MAX_ACTIVE_ROSTER) {
    return { error: `Roster is full (${MAX_ACTIVE_ROSTER} max, subs excluded).` };
  }

  await supabase
    .from("team_members")
    .update({ status: "active" })
    .eq("id", memberId)
    .eq("team_id", teamId);

  revalidatePath(`/teams/${teamId}/manage`);
  revalidatePath(`/teams/${teamId}`);
}

export async function declineRequestAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const teamId = formData.get("teamId");
  const memberId = formData.get("memberId");
  if (typeof teamId !== "string" || typeof memberId !== "string") {
    return { error: "Missing team or member." };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  const role = await getRole(supabase, teamId, user.id);
  if (!role || (role !== "owner" && role !== "captain")) {
    return { error: "Only the owner or a captain can decline requests." };
  }

  await supabase.from("team_members").delete().eq("id", memberId).eq("team_id", teamId);

  revalidatePath(`/teams/${teamId}/manage`);
}

export async function removeMemberAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const teamId = formData.get("teamId");
  const memberId = formData.get("memberId");
  if (typeof teamId !== "string" || typeof memberId !== "string") {
    return { error: "Missing team or member." };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  const role = await getRole(supabase, teamId, user.id);
  if (!role || (role !== "owner" && role !== "captain")) {
    return { error: "Only the owner or a captain can remove members." };
  }

  await supabase
    .from("team_members")
    .delete()
    .eq("id", memberId)
    .eq("team_id", teamId)
    .neq("role_on_team", "owner");

  revalidatePath(`/teams/${teamId}/manage`);
  revalidatePath(`/teams/${teamId}`);
}

export async function updateMemberRoleAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const teamId = formData.get("teamId");
  const memberId = formData.get("memberId");
  const newRole = formData.get("role");
  if (
    typeof teamId !== "string" ||
    typeof memberId !== "string" ||
    (newRole !== "captain" && newRole !== "player" && newRole !== "sub")
  ) {
    return { error: "Invalid request." };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  const role = await getRole(supabase, teamId, user.id);
  if (!role || (role !== "owner" && role !== "captain")) {
    return { error: "Only the owner or a captain can change roles." };
  }

  if (newRole !== "sub") {
    const activeCount = await countActiveNonSub(supabase, teamId, memberId);
    if (activeCount >= MAX_ACTIVE_ROSTER) {
      return { error: `Roster is full (${MAX_ACTIVE_ROSTER} max, subs excluded).` };
    }
  }

  await supabase
    .from("team_members")
    .update({ role_on_team: newRole })
    .eq("id", memberId)
    .eq("team_id", teamId)
    .neq("role_on_team", "owner");

  revalidatePath(`/teams/${teamId}/manage`);
  revalidatePath(`/teams/${teamId}`);
}

export async function deleteTeamAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/teams");

  const teamId = formData.get("teamId");
  if (typeof teamId !== "string") redirect("/teams");

  const { supabase, user } = await requireUser();
  if (!user) redirect("/login");

  const { data: team } = await supabase
    .from("teams")
    .select("owner_id")
    .eq("id", teamId)
    .maybeSingle();

  if (team?.owner_id !== user.id) {
    redirect(`/teams/${teamId}/manage`);
  }

  await supabase.from("teams").delete().eq("id", teamId);
  redirect("/teams");
}

export async function inviteToTeamAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const teamId = formData.get("teamId");
  const inviteeId = formData.get("inviteeId");
  if (typeof teamId !== "string" || typeof inviteeId !== "string") {
    return { error: "Missing team or friend." };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  const role = await getRole(supabase, teamId, user.id);
  if (!role || (role !== "owner" && role !== "captain")) {
    return { error: "Only the owner or a captain can invite members." };
  }

  const activeCount = await countActiveNonSub(supabase, teamId);
  if (activeCount >= MAX_ACTIVE_ROSTER) {
    return { error: `Roster is full (${MAX_ACTIVE_ROSTER} max, subs excluded).` };
  }

  const { error } = await supabase.from("team_members").insert({
    team_id: teamId,
    user_id: inviteeId,
    role_on_team: "player",
    status: "invited",
  });

  if (error) {
    return error.code === "23505"
      ? { error: "They're already invited or on the team." }
      : { error: "Couldn't send the invite. Please try again." };
  }

  revalidatePath(`/teams/${teamId}/manage`);
}

export async function acceptTeamInviteAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const teamId = formData.get("teamId");
  if (typeof teamId !== "string") return { error: "Missing team." };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  const activeCount = await countActiveNonSub(supabase, teamId);
  if (activeCount >= MAX_ACTIVE_ROSTER) {
    return { error: `Roster is full (${MAX_ACTIVE_ROSTER} max, subs excluded).` };
  }

  await supabase
    .from("team_members")
    .update({ status: "active" })
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .eq("status", "invited");

  revalidatePath(`/teams/${teamId}`);
  revalidatePath("/teams");
}

export async function declineTeamInviteAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const teamId = formData.get("teamId");
  if (typeof teamId !== "string") return { error: "Missing team." };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .eq("status", "invited");

  revalidatePath("/teams");
}
