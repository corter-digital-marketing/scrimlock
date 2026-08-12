import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Runs on every request (excluding static assets) to keep the Supabase
 * auth session fresh. Route protection for create/manage pages lands
 * alongside those pages rather than here — see each route's own auth
 * check once it exists.
 */
export async function proxy(request: NextRequest) {
  const { supabaseResponse } = await updateSession(request);
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
