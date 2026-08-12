import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOwnProfile } from "@/lib/supabase/profiles";
import { getActiveHeroes } from "@/lib/supabase/heroes";
import { getCurrentUser } from "@/lib/supabase/auth";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { DecoDivider } from "@/components/site/deco-divider";

export const metadata: Metadata = { title: "Edit Profile" };

// Per-user, auth-gated page — never statically shared between visitors.
// (Belt-and-suspenders: `cookies()` usage inside getCurrentUser() already
// forces this dynamic once real Supabase env vars are set, but that
// detection is env-var-timing-dependent, so this makes it unconditional.)
export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/settings/profile");
  }

  const [profile, heroes] = await Promise.all([
    getOwnProfile(),
    getActiveHeroes(),
  ]);

  if (!profile) {
    // Signed in, but the profile row hasn't shown up yet (auto-create
    // trigger races the first render) — send them home rather than at a
    // form with nothing to edit.
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="text-center">
        <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
          Your dossier
        </p>
        <h1 className="font-display mt-3 text-4xl text-parchment">
          Edit Profile
        </h1>
      </div>

      <DecoDivider className="mt-8" />

      <div className="frame-brass mt-10 rounded-sm bg-surface px-6 py-8 sm:px-10">
        <ProfileSettingsForm profile={profile} email={user.email} heroes={heroes} />
      </div>
    </div>
  );
}
