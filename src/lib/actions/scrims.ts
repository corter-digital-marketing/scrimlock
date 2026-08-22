"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createScrimSchema, respondToScrimSchema } from "@/lib/validations/scrim";

export type ScrimActionState = {
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

async function requirePoster(
  supabase: Awaited<ReturnType<typeof createClient>>,
  scrimId: string,
  userId: string,
) {
  const { data } = await supabase
    .from("scrims")
    .select("posted_by")
    .eq("id", scrimId)
    .maybeSingle();
  return data?.posted_by === userId;
}

export async function createScrimAction(
  _prevState: ScrimActionState,
  formData: FormData,
): Promise<ScrimActionState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const { supabase, user } = await requireUser();
  if (!user) redirect("/login?next=/scrims/new");

  const teamId = formData.get("teamId");
  const minRankId = formData.get("minRankId");
  const maxRankId = formData.get("maxRankId");

  const parsed = createScrimSchema.safeParse({
    teamId: teamId && teamId !== "none" ? teamId : undefined,
    region: formData.get("region"),
    minRankId: minRankId && minRankId !== "any" ? minRankId : undefined,
    maxRankId: maxRankId && maxRankId !== "any" ? maxRankId : undefined,
    scheduledFor: formData.get("scheduledFor"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { data: scrim, error } = await supabase
    .from("scrims")
    .insert({
      posted_by: user.id,
      team_id: parsed.data.teamId ?? null,
      region: parsed.data.region,
      min_rank_id: parsed.data.minRankId ?? null,
      max_rank_id: parsed.data.maxRankId ?? null,
      scheduled_for: parsed.data.scheduledFor,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();

  if (error || !scrim) {
    return { error: "Couldn't post the scrim. Please try again." };
  }

  redirect(`/scrims/${scrim.id}`);
}

export async function respondToScrimAction(
  _prevState: ScrimActionState,
  formData: FormData,
): Promise<ScrimActionState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const scrimId = formData.get("scrimId");
  if (typeof scrimId !== "string") return { error: "Missing scrim." };

  const { supabase, user } = await requireUser();
  if (!user) redirect(`/login?next=/scrims/${scrimId}`);

  const { data: scrim } = await supabase
    .from("scrims")
    .select("posted_by, status")
    .eq("id", scrimId)
    .maybeSingle();

  if (!scrim) return { error: "This scrim no longer exists." };
  if (scrim.posted_by === user.id) return { error: "You posted this scrim." };
  if (scrim.status !== "open") return { error: "This scrim isn't open anymore." };

  const teamId = formData.get("teamId");
  const parsed = respondToScrimSchema.safeParse({
    teamId: teamId && teamId !== "none" ? teamId : undefined,
    message: formData.get("message") || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { error } = await supabase.from("scrim_responses").insert({
    scrim_id: scrimId,
    responder_id: user.id,
    team_id: parsed.data.teamId ?? null,
    message: parsed.data.message || null,
  });

  if (error) {
    return error.code === "23505"
      ? { error: "You've already responded to this scrim." }
      : { error: "Couldn't send your response. Please try again." };
  }

  revalidatePath(`/scrims/${scrimId}`);
  return null;
}

export async function cancelResponseAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const scrimId = formData.get("scrimId");
  if (typeof scrimId !== "string") return { error: "Missing scrim." };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  await supabase
    .from("scrim_responses")
    .delete()
    .eq("scrim_id", scrimId)
    .eq("responder_id", user.id);

  revalidatePath(`/scrims/${scrimId}`);
}

export async function acceptResponseAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const scrimId = formData.get("scrimId");
  const responseId = formData.get("responseId");
  if (typeof scrimId !== "string" || typeof responseId !== "string") {
    return { error: "Missing scrim or response." };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };
  if (!(await requirePoster(supabase, scrimId, user.id))) {
    return { error: "Only the poster can accept responses." };
  }

  await supabase.from("scrim_responses").update({ status: "accepted" }).eq("id", responseId);
  await supabase
    .from("scrim_responses")
    .update({ status: "declined" })
    .eq("scrim_id", scrimId)
    .eq("status", "pending")
    .neq("id", responseId);
  await supabase.from("scrims").update({ status: "matched" }).eq("id", scrimId);

  revalidatePath(`/scrims/${scrimId}`);
}

export async function declineResponseAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const scrimId = formData.get("scrimId");
  const responseId = formData.get("responseId");
  if (typeof scrimId !== "string" || typeof responseId !== "string") {
    return { error: "Missing scrim or response." };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };
  if (!(await requirePoster(supabase, scrimId, user.id))) {
    return { error: "Only the poster can decline responses." };
  }

  await supabase.from("scrim_responses").update({ status: "declined" }).eq("id", responseId);

  revalidatePath(`/scrims/${scrimId}`);
}

export async function cancelScrimAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const scrimId = formData.get("scrimId");
  if (typeof scrimId !== "string") return { error: "Missing scrim." };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };
  if (!(await requirePoster(supabase, scrimId, user.id))) {
    return { error: "Only the poster can cancel this scrim." };
  }

  await supabase.from("scrims").update({ status: "cancelled" }).eq("id", scrimId);

  revalidatePath(`/scrims/${scrimId}`);
}

export async function deleteScrimAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/scrims");

  const scrimId = formData.get("scrimId");
  if (typeof scrimId !== "string") redirect("/scrims");

  const { supabase, user } = await requireUser();
  if (!user) redirect("/login");
  if (!(await requirePoster(supabase, scrimId, user.id))) {
    redirect(`/scrims/${scrimId}`);
  }

  await supabase.from("scrims").delete().eq("id", scrimId);
  redirect("/scrims");
}
