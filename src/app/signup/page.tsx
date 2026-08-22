import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { OAuthButton } from "@/components/auth/oauth-button";
import { SignUpForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Sign Up" };

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  "google-oauth-failed": "Couldn't start Google sign-in. Please try again.",
  "auth-callback-failed": "That sign-in link is invalid or expired.",
  "not-configured":
    "This site isn't connected to a backend yet — add Supabase credentials to .env.local (see README).",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const errorMessage = error ? OAUTH_ERROR_MESSAGES[error] : undefined;

  return (
    <AuthCard
      eyebrow="Join the ladder"
      title="Sign Up"
      description="Create an account to register for tournaments, post scrims, and find teammates."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-brass hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {errorMessage ? (
          <p
            role="alert"
            className="rounded-sm border border-oxblood/50 bg-oxblood/10 px-3 py-2 text-sm text-parchment"
          >
            {errorMessage}
          </p>
        ) : null}

        <OAuthButton provider="google" next={next} />

        <div
          aria-hidden="true"
          className="flex items-center gap-3 text-xs tracking-widest text-parchment-dim uppercase"
        >
          <span className="h-px flex-1 bg-brass-dim/40" />
          or
          <span className="h-px flex-1 bg-brass-dim/40" />
        </div>

        <SignUpForm />
      </div>
    </AuthCard>
  );
}
