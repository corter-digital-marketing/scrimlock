import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Shared landing spot for both flows: Google OAuth redirects here with a
 * `code` after the consent screen, and email "confirm your account" links
 * point here too (see `emailRedirectTo` in signUpAction).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
