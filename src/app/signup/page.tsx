import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/signup-form";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";

export const metadata: Metadata = { title: "Sign Up" };

export default function SignUpPage() {
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
        <GoogleAuthButton />

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
