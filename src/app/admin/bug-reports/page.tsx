import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getBugReports } from "@/lib/supabase/bug-reports";
import { LocalDateTime } from "@/components/site/local-datetime";
import { DecoDivider } from "@/components/site/deco-divider";

export const metadata: Metadata = { title: "Bug Reports" };
export const dynamic = "force-dynamic";

export default async function AdminBugReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/bug-reports");
  if (!user.isAdmin) notFound();

  const reports = await getBugReports();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="text-center">
        <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
          Admin
        </p>
        <h1 className="font-display mt-3 text-4xl text-parchment">
          Bug Reports
        </h1>
        <p className="font-body mx-auto mt-4 max-w-md text-parchment-dim">
          Everything submitted through the &quot;Found a Bug?&quot; box in
          the footer, newest first.
        </p>
      </div>

      <DecoDivider className="mt-8" />

      {reports.length === 0 ? (
        <p className="font-body mt-10 text-center text-sm text-parchment-dim">
          No reports yet.
        </p>
      ) : (
        <ul className="mt-10 flex flex-col gap-4">
          {reports.map((report) => (
            <li
              key={report.id}
              className="frame-brass rounded-sm bg-surface px-6 py-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-label text-xs tracking-widest text-brass-dim uppercase">
                  <LocalDateTime value={report.created_at} />
                </p>
                {report.page_url ? (
                  <Link
                    href={report.page_url}
                    className="font-label text-xs tracking-widest text-verdigris uppercase hover:text-brass"
                  >
                    {report.page_url}
                  </Link>
                ) : null}
              </div>
              <p className="font-body mt-3 whitespace-pre-line text-parchment">
                {report.message}
              </p>
              <p className="font-body mt-3 text-xs text-parchment-dim">
                {report.reporter ? (
                  <>
                    From{" "}
                    <Link
                      href={`/profile/${report.reporter.username}`}
                      className="hover:text-brass"
                    >
                      {report.reporter.display_name}
                    </Link>
                  </>
                ) : (
                  "From a signed-out visitor"
                )}
                {report.email ? <> &middot; {report.email}</> : null}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
