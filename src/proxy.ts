import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Signed-out-only optimistic check (path patterns, not full authorization —
// e.g. "is this person a captain of *this* team" still happens page-side).
const PROTECTED_PATTERNS = [
  /^\/settings(\/|$)/,
  /^\/teams\/new$/,
  /^\/teams\/[^/]+\/manage$/,
  /^\/scrims\/new$/,
  /^\/tournaments\/new$/,
  /^\/tournaments\/[^/]+\/manage$/,
  /^\/admin(\/|$)/,
  /^\/friends(\/|$)/,
  /^\/messages(\/|$)/,
];

/**
 * Runs on every request (excluding static assets) to keep the Supabase
 * auth session fresh, plus an optimistic redirect for signed-out visitors
 * hitting a protected route. This is a fast, cookie-only check (no DB
 * round trip) — each protected page also verifies the session itself,
 * per Next's guidance not to rely on proxy as the only line of defense.
 */
export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const isProtected = PROTECTED_PATTERNS.some((pattern) =>
    pattern.test(request.nextUrl.pathname),
  );

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
