"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { bugReportSchema } from "@/lib/validations/bug-report";

export type BugReportActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
} | null;

const NOT_CONFIGURED_ERROR =
  "This site isn't connected to a backend yet — add Supabase credentials to .env.local (see README).";

/** Deliberately works signed out — a broken sign-in flow is exactly the
 * kind of bug someone needs to report without first signing in. */
export async function reportBugAction(
  _prevState: BugReportActionState,
  formData: FormData,
): Promise<BugReportActionState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED_ERROR };

  const parsed = bugReportSchema.safeParse({
    email: formData.get("email") || undefined,
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pageUrl = formData.get("pageUrl");

  const { error } = await supabase.from("bug_reports").insert({
    reporter_id: user?.id ?? null,
    email: parsed.data.email || null,
    message: parsed.data.message,
    page_url: typeof pageUrl === "string" ? pageUrl : null,
  });

  if (error) {
    return { error: "Couldn't send that. Please try again." };
  }

  return { success: true };
}
