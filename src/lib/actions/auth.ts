"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Google and Discord are the only sign-in methods (by design — no
 * passwords means no password-reset flow to build or run).
 */
export type OAuthProvider = "google" | "discord";

async function getOrigin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return `${proto}://${host}`;
}

/** Only ever redirect to a same-site path — never follow an open redirect. */
function safeNext(next: string | undefined) {
  if (typeof next !== "string") return "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

/**
 * Bound with `.bind(null, provider, next)` from a plain `<form action={...}>`
 * — no client JS required. Computes Supabase's OAuth URL and redirects the
 * browser to the provider's consent screen.
 */
export async function signInWithOAuthAction(
  provider: OAuthProvider,
  next: string | undefined,
  // Required by the bound form-action signature — unused.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
) {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=not-configured");
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", safeNext(next));

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: callbackUrl.toString() },
  });

  if (error || !data.url) {
    redirect(`/login?error=${provider}-oauth-failed`);
  }

  redirect(data.url);
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
