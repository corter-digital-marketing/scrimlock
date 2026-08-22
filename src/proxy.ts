import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Signed-out-only optimistic check (path patterns, not full authorization —
// e.g. "is this person a captain of *this* team" still happens page-side).
//
// This is also the ONLY reliable way to redirect a signed-out visitor on a
// direct/fresh navigation in this app: page-level `redirect()` (and
// `notFound()`) calls from deep Server Components render the right content
// but don't flip the HTTP status code on a fresh GET (verified in both dev
// and a production build — status stays 200 either way, though client-side
// in-app navigation isn't affected). `/pug/[matchId]` avoids `notFound()`
// entirely for that reason (see the page) and leans on this list instead
// of its own `redirect()` for the signed-out case.
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
  /^\/pug\/[^/]+$/,
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
