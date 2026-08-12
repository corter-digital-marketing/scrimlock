import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Server-side Supabase client, for use in Server Components, Server
 * Actions, and Route Handlers. Reads/writes auth cookies via `next/headers`.
 *
 * `setAll` is wrapped in try/catch because Server Components can't set
 * cookies — that's fine as long as the proxy (Phase 2) refreshes the
 * session, which keeps `getUser()` working everywhere.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — ignored, the proxy refreshes
            // the session on the next request.
          }
        },
      },
    },
  );
}
