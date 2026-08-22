import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getAllHeroes } from "@/lib/supabase/heroes";
import { AddHeroForm } from "@/components/admin/add-hero-form";
import { HeroAdminList } from "@/components/admin/hero-admin-list";
import { DecoDivider } from "@/components/site/deco-divider";

export const metadata: Metadata = { title: "Manage Heroes" };
export const dynamic = "force-dynamic";

export default async function AdminHeroesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/heroes");
  if (!user.isAdmin) notFound();

  const heroes = await getAllHeroes();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="text-center">
        <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
          Admin
        </p>
        <h1 className="font-display mt-3 text-4xl text-parchment">
          Manage Heroes
        </h1>
        <p className="font-body mx-auto mt-4 max-w-md text-parchment-dim">
          Inactive heroes drop out of preferred-hero pickers everywhere but
          stay on existing profiles.
        </p>
      </div>

      <DecoDivider className="mt-8" />

      <div className="frame-brass mt-10 rounded-sm bg-surface px-6 py-8 sm:px-10">
        <AddHeroForm />
      </div>

      <div className="frame-brass mt-8 rounded-sm bg-surface px-6 py-8 sm:px-10">
        <p className="font-label mb-4 text-xs tracking-widest text-brass-dim uppercase">
          Roster ({heroes.filter((h) => h.is_active).length} active /{" "}
          {heroes.length} total)
        </p>
        <HeroAdminList heroes={heroes} />
      </div>
    </div>
  );
}
