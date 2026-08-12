import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/site/page-placeholder";

export const metadata: Metadata = { title: "Tournaments" };

export default function TournamentsPage() {
  return (
    <PagePlaceholder
      eyebrow="The Bill"
      title="Tournaments"
      description="Organizers post fight cards, players and squads sign up. Browsing, entries, and brackets land in Phase 6."
      phaseNote="This tab is wired into the nav now as a placeholder. Creation, registration, and organizer tools arrive once accounts and teams exist."
    />
  );
}
