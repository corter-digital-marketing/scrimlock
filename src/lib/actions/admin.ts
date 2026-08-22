"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { addHeroSchema } from "@/lib/validations/hero";

export type AdminActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export type SimpleActionResult = { error?: string } | void;

const NOT_CONFIGURED_ERROR =
  "This site isn't connected to a backend yet — add Supabase credentials to .env.local (see README).";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  return { supabase, ok: profile?.is_admin === true };
}

export async function addHeroAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const { supabase, ok } = await requireAdmin();
  if (!ok) return { error: "Admins only." };

  const parsed = addHeroSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { error } = await supabase.from("heroes").insert({ name: parsed.data.name });

  if (error) {
    return error.code === "23505"
      ? { fieldErrors: { name: ["A hero with that name already exists."] } }
      : { error: "Couldn't add that hero. Please try again." };
  }

  revalidatePath("/admin/heroes");
  return null;
}

export async function toggleHeroActiveAction(formData: FormData): Promise<SimpleActionResult> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const heroId = formData.get("heroId");
  const isActive = formData.get("isActive") === "true";
  if (typeof heroId !== "string") return { error: "Missing hero." };

  const { supabase, ok } = await requireAdmin();
  if (!ok) return { error: "Admins only." };

  await supabase.from("heroes").update({ is_active: !isActive }).eq("id", heroId);

  revalidatePath("/admin/heroes");
}
