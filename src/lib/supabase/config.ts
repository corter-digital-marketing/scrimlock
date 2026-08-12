/**
 * True once real Supabase credentials are in the environment. Auth code
 * checks this before touching the Supabase client so the app degrades to
 * "signed out" instead of crashing when `.env.local` is still empty
 * (e.g. a fresh clone, or local dev before a project is linked).
 */
export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
