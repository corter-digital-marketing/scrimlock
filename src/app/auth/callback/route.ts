import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: string | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/";
}

/**
 * Shared landing spot for both flows: Google OAuth redirects here with a
 * `code` after the consent screen, and email "confirm your account" links
 * point here too (see `emailRedirectTo` in signUpAction).
 *
 * Where to send the user next comes from the `oauth-next` cookie set in
 * signInWithOAuthAction, not a `?next=` query param on this URL — Supabase's
 * redirect-URL allow list matching didn't reliably honor a redirectTo that
 * carried a query string, even with an exact entry and a `/**` wildcard
 * both configured for it, so the callback URL itself now stays bare.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  const cookieStore = await cookies();
  const next = safeNext(cookieStore.get("oauth-next")?.value);
  cookieStore.delete("oauth-next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
