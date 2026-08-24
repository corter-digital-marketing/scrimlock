"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createTournamentSchema } from "@/lib/validations/tournament";
import type { TournamentStatus } from "@/lib/supabase/database.types";

export type TournamentActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

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

async function requireOrganizer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tournamentId: string,
  userId: string,
) {
  const { data } = await supabase
    .from("tournaments")
    .select("organizer_id")
    .eq("id", tournamentId)
    .maybeSingle();
  return data?.organizer_id === userId;
}

async function uploadBanner(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tournamentId: string,
  banner: File,
) {
  const ext = banner.name.split(".").pop() || "png";
  const path = `${tournamentId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("tournament-banners")
    .upload(path, banner, { contentType: banner.type, upsert: true });
  if (error) return null;
  return supabase.storage.from("tournament-banners").getPublicUrl(path).data.publicUrl;
}

function extractFormFields(formData: FormData) {
  const minRankId = formData.get("minRankId");
  const maxRankId = formData.get("maxRankId");
  const banner = formData.get("banner");

  return {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    format: formData.get("format") || undefined,
    region: formData.get("region"),
    prizePool: formData.get("prizePool") || undefined,
    entryType: formData.get("entryType"),
    maxParticipants: formData.get("maxParticipants"),
    minRankId: minRankId && minRankId !== "any" ? minRankId : undefined,
    maxRankId: maxRankId && maxRankId !== "any" ? maxRankId : undefined,
    startsAt: formData.get("startsAt"),
    registrationClosesAt: formData.get("registrationClosesAt"),
    signupUrl: formData.get("signupUrl") || undefined,
    banner: banner instanceof File && banner.size > 0 ? banner : undefined,
  };
}

export async function createTournamentAction(
  _prevState: TournamentActionState,
  formData: FormData,
): Promise<TournamentActionState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const { supabase, user } = await requireUser();
  if (!user) redirect("/login?next=/tournaments/new");

  const parsed = createTournamentSchema.safeParse(extractFormFields(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { data: tournament, error } = await supabase
    .from("tournaments")
    .insert({
      title: parsed.data.title,
      organizer_id: user.id,
      description: parsed.data.description || "",
      format: parsed.data.format || null,
      region: parsed.data.region,
      prize_pool: parsed.data.prizePool || null,
      entry_type: parsed.data.entryType,
      max_participants: parsed.data.maxParticipants,
      min_rank_id: parsed.data.minRankId ?? null,
      max_rank_id: parsed.data.maxRankId ?? null,
      starts_at: parsed.data.startsAt,
      registration_closes_at: parsed.data.registrationClosesAt,
      signup_url: parsed.data.signupUrl || null,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !tournament) {
    return { error: "Couldn't create the tournament. Please try again." };
  }

  if (parsed.data.banner) {
    const bannerUrl = await uploadBanner(supabase, tournament.id, parsed.data.banner);
    if (bannerUrl) {
      await supabase.from("tournaments").update({ banner_url: bannerUrl }).eq("id", tournament.id);
    }
  }

  redirect(`/tournaments/${tournament.id}/manage`);
}

export async function updateTournamentAction(
  _prevState: TournamentActionState,
  formData: FormData,
): Promise<TournamentActionState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const tournamentId = formData.get("tournamentId");
  if (typeof tournamentId !== "string") return { error: "Missing tournament." };

  const { supabase, user } = await requireUser();
  if (!user) redirect(`/login?next=/tournaments/${tournamentId}/manage`);
  if (!(await requireOrganizer(supabase, tournamentId, user.id))) {
    return { error: "Only the organizer can edit this tournament." };
  }

  const parsed = createTournamentSchema.safeParse(extractFormFields(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let bannerUrl: string | undefined;
  if (parsed.data.banner) {
    const uploaded = await uploadBanner(supabase, tournamentId, parsed.data.banner);
    if (uploaded) bannerUrl = uploaded;
  }

  const { error } = await supabase
    .from("tournaments")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || "",
      format: parsed.data.format || null,
      region: parsed.data.region,
      prize_pool: parsed.data.prizePool || null,
      entry_type: parsed.data.entryType,
      max_participants: parsed.data.maxParticipants,
      min_rank_id: parsed.data.minRankId ?? null,
      max_rank_id: parsed.data.maxRankId ?? null,
      starts_at: parsed.data.startsAt,
      registration_closes_at: parsed.data.registrationClosesAt,
      signup_url: parsed.data.signupUrl || null,
      ...(bannerUrl ? { banner_url: bannerUrl } : {}),
    })
    .eq("id", tournamentId);

  if (error) {
    return { error: "Couldn't save the tournament. Please try again." };
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/manage`);
  return null;
}

export async function setTournamentStatusAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const tournamentId = formData.get("tournamentId");
  const status = formData.get("status") as TournamentStatus | null;
  const validStatuses: TournamentStatus[] = ["draft", "open", "closed", "in_progress", "completed"];
  if (typeof tournamentId !== "string" || !status || !validStatuses.includes(status)) {
    return { error: "Invalid request." };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };
  if (!(await requireOrganizer(supabase, tournamentId, user.id))) {
    return { error: "Only the organizer can change status." };
  }

  await supabase.from("tournaments").update({ status }).eq("id", tournamentId);

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/manage`);
}

export async function deleteTournamentAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/tournaments");

  const tournamentId = formData.get("tournamentId");
  if (typeof tournamentId !== "string") redirect("/tournaments");

  const { supabase, user } = await requireUser();
  if (!user) redirect("/login");
  if (!(await requireOrganizer(supabase, tournamentId, user.id))) {
    redirect(`/tournaments/${tournamentId}/manage`);
  }

  await supabase.from("tournaments").delete().eq("id", tournamentId);
  redirect("/tournaments");
}
