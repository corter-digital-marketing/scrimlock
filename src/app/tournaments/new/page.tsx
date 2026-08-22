import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createTournamentAction } from "@/lib/actions/tournaments";
import { TournamentForm } from "@/components/tournaments/tournament-form";
import { DecoDivider } from "@/components/site/deco-divider";

export const metadata: Metadata = { title: "Create a Tournament" };
export const dynamic = "force-dynamic";

export default async function NewTournamentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/tournaments/new");

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="text-center">
        <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
          Compete
        </p>
        <h1 className="font-display mt-3 text-4xl text-parchment">
          Create a Tournament
        </h1>
        <p className="font-body mt-4 text-parchment-dim">
          It starts as a draft — open it for registration from the manage
          page when you&apos;re ready.
        </p>
      </div>

      <DecoDivider className="mt-8" />

      <div className="frame-brass mt-10 rounded-sm bg-surface px-6 py-8 sm:px-10">
        <TournamentForm action={createTournamentAction} submitLabel="Create Tournament" />
      </div>
    </div>
  );
}
