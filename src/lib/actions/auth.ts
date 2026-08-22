"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { loginSchema, signUpSchema } from "@/lib/validations/auth";

/** Google is the only OAuth provider surfaced in the UI right now (Discord
 * support is still here, just unused — cheap to re-enable if wanted). */
export type OAuthProvider = "google" | "discord";

export type AuthActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  message?: string;
} | null;

const NOT_CONFIGURED_ERROR =
  "This site isn't connected to a backend yet — add Supabase credentials to .env.local (see README).";

async function getOrigin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return `${proto}://${host}`;
}

/** Only ever redirect to a same-site path — never follow an open redirect. */
function safeNext(next: FormDataEntryValue | string | null | undefined) {
  if (typeof next !== "string") return "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { error: NOT_CONFIGURED_ERROR };
  }

  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    return { error: error.message };
  }

  // Email confirmation is on by default for a new Supabase project: no
  // session comes back yet, and the user needs to click the link they
  // were just emailed. If confirmations are off, Supabase returns a
  // session immediately and the user is already signed in.
  if (!data.session) {
    return {
      message: "Check your email to confirm your account before signing in.",
    };
  }

  redirect("/");
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { error: NOT_CONFIGURED_ERROR };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Incorrect email or password." };
  }

  redirect(safeNext(formData.get("next")));
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
