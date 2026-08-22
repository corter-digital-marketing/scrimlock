import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type HeroOption = { id: string; name: string };
export type HeroRow = HeroOption & { is_active: boolean; created_at: string };

/** Active heroes from the admin-editable `heroes` table — never hardcoded. */
export async function getActiveHeroes(): Promise<HeroOption[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("heroes")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return data ?? [];
}

/** Every hero, active or not — for the admin roster editor. */
export async function getAllHeroes(): Promise<HeroRow[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("heroes")
    .select("id, name, is_active, created_at")
    .order("name");

  return data ?? [];
}

/** Look up specific heroes by id — for rendering a profile's preferred heroes. */
export async function getHeroesByIds(ids: string[]): Promise<HeroOption[]> {
  if (!isSupabaseConfigured() || ids.length === 0) return [];

  const supabase = await createClient();
  const { data } = await supabase.from("heroes").select("id, name").in("id", ids);

  return data ?? [];
}
