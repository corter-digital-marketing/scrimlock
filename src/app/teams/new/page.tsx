import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { CreateTeamForm } from "@/components/teams/create-team-form";
import { DecoDivider } from "@/components/site/deco-divider";

export const metadata: Metadata = { title: "Create a Team" };
export const dynamic = "force-dynamic";

export default async function NewTeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/teams/new");

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="text-center">
        <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
          Found a syndicate
        </p>
        <h1 className="font-display mt-3 text-4xl text-parchment">
          Create a Team
        </h1>
        <p className="font-body mt-4 text-parchment-dim">
          You&apos;ll be seated as owner — manage your roster and recruiting
          from the team page afterward.
        </p>
      </div>

      <DecoDivider className="mt-8" />

      <div className="frame-brass mt-10 rounded-sm bg-surface px-6 py-8 sm:px-10">
        <CreateTeamForm />
      </div>
    </div>
  );
}
