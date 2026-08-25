import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

export type BugReportRow = Database["public"]["Tables"]["bug_reports"]["Row"];

export type BugReportWithReporter = BugReportRow & {
  reporter: { username: string; display_name: string } | null;
};

/**
 * Admin-only (RLS: "admins read bug reports" requires profiles.is_admin —
 * see 20260824210000_bug_reports.sql). No FK embedding here because this
 * schema's generated types carry no Relationships, same as everywhere
 * else in this codebase — two queries, merged in JS, instead.
 */
export async function getBugReports(): Promise<BugReportWithReporter[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("bug_reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (!reports?.length) return [];

  const reporterIds = [...new Set(reports.map((r) => r.reporter_id).filter((id): id is string => !!id))];
  const reporters = reporterIds.length
    ? await supabase.from("profiles").select("id, username, display_name").in("id", reporterIds)
    : { data: [] };

  const byId = new Map((reporters.data ?? []).map((p) => [p.id, p]));

  return reports.map((r) => ({
    ...r,
    reporter: r.reporter_id && byId.has(r.reporter_id)
      ? { username: byId.get(r.reporter_id)!.username, display_name: byId.get(r.reporter_id)!.display_name }
      : null,
  }));
}
