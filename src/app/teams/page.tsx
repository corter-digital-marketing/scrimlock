import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/site/page-placeholder";

export const metadata: Metadata = { title: "Teams" };

export default function TeamsPage() {
  return (
    <PagePlaceholder
      eyebrow="Syndicates"
      title="Teams"
      description="Rosters, recruiting notes, and roles. Lands in Phase 3, right after accounts and profiles."
      phaseNote="This tab is wired into the nav now as a placeholder. Team creation and roster management arrive in Phase 3."
    />
  );
}
