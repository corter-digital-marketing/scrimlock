import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type HeroOption = { id: string; name: string };

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

/** Look up specific heroes by id — for rendering a profile's preferred heroes. */
export async function getHeroesByIds(ids: string[]): Promise<HeroOption[]> {
  if (!isSupabaseConfigured() || ids.length === 0) return [];

  const supabase = await createClient();
  const { data } = await supabase.from("heroes").select("id, name").in("id", ids);

  return data ?? [];
}
