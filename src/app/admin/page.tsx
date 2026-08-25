import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { DecoDivider } from "@/components/site/deco-divider";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!user.isAdmin) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="text-center">
        <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
          Behind the desk
        </p>
        <h1 className="font-display mt-3 text-4xl text-parchment">Admin</h1>
      </div>

      <DecoDivider className="mt-8" />

      <div className="frame-brass mt-10 flex flex-col gap-1 rounded-sm bg-surface p-2">
        <Link
          href="/admin/heroes"
          className="rounded-sm px-4 py-3 transition-weighted hover:bg-surface-2"
        >
          <p className="font-display text-parchment">Heroes</p>
          <p className="font-body text-sm text-parchment-dim">
            Add heroes as Valve releases them, retire ones that get removed.
          </p>
        </Link>
        <Link
          href="/admin/bug-reports"
          className="rounded-sm px-4 py-3 transition-weighted hover:bg-surface-2"
        >
          <p className="font-display text-parchment">Bug Reports</p>
          <p className="font-body text-sm text-parchment-dim">
            Everything submitted through the footer&apos;s &quot;Found a
            Bug?&quot; box.
          </p>
        </Link>
      </div>

      <p className="font-body mt-6 text-center text-xs text-parchment-dim">
        Ranks aren&apos;t editable here — the ladder rarely changes and a bad
        edit would break every rank filter site-wide. Edit
        supabase/migrations directly if it ever needs to change.
      </p>
    </div>
  );
}
