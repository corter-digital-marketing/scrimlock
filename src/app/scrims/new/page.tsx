import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getManagedTeams } from "@/lib/supabase/teams";
import { CreateScrimForm } from "@/components/scrims/create-scrim-form";
import { DecoDivider } from "@/components/site/deco-divider";

export const metadata: Metadata = { title: "Post a Scrim" };
export const dynamic = "force-dynamic";

export default async function NewScrimPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/scrims/new");

  const teams = await getManagedTeams(user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="text-center">
        <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
          Arrangements
        </p>
        <h1 className="font-display mt-3 text-4xl text-parchment">
          Post a Scrim
        </h1>
        <p className="font-body mt-4 text-parchment-dim">
          Times are shown to everyone in their own timezone — post in yours.
        </p>
      </div>

      <DecoDivider className="mt-8" />

      <div className="frame-brass mt-10 rounded-sm bg-surface px-6 py-8 sm:px-10">
        <CreateScrimForm teams={teams} />
      </div>
    </div>
  );
}
