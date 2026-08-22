import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { OAuthButton } from "@/components/auth/oauth-button";

export const metadata: Metadata = { title: "Sign In" };

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  "google-oauth-failed": "Couldn't start Google sign-in. Please try again.",
  "discord-oauth-failed": "Couldn't start Discord sign-in. Please try again.",
  "auth-callback-failed": "That sign-in link is invalid or expired.",
  "not-configured":
    "This site isn't connected to a backend yet — add Supabase credentials to .env.local (see README).",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const errorMessage = error ? OAUTH_ERROR_MESSAGES[error] : undefined;

  return (
    <AuthCard
      eyebrow="Welcome back"
      title="Sign In"
      description="Sign in to register for tournaments, post scrims, and manage your team."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-brass hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {errorMessage ? (
          <p
            role="alert"
            className="rounded-sm border border-oxblood/50 bg-oxblood/10 px-3 py-2 text-sm text-parchment"
          >
            {errorMessage}
          </p>
        ) : null}

        <OAuthButton provider="google" next={next} />
        <OAuthButton provider="discord" next={next} />
      </div>
    </AuthCard>
  );
}
