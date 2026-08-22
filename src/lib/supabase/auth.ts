import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type CurrentUser = {
  id: string;
  email: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
};

/**
 * Current signed-in user, for Server Components (e.g. the root layout's
 * header). Uses `getUser()`, not `getSession()` — it revalidates the JWT
 * against the Supabase Auth server instead of trusting the cookie as-is.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, is_admin")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    username: profile?.username ?? null,
    displayName: profile?.display_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    isAdmin: profile?.is_admin ?? false,
  };
}
