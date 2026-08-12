import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/site/page-placeholder";

export const metadata: Metadata = { title: "Tournaments" };

export default function TournamentsPage() {
  return (
    <PagePlaceholder
      eyebrow="Compete"
      title="Tournaments"
      description="Organizers create tournaments with prize pools and rank requirements. Players and teams sign up to compete. Full browsing, registration, and brackets land in Phase 6."
      phaseNote="This tab is wired into the nav now as a placeholder. Creation, registration, and organizer tools arrive once accounts and teams exist."
    />
  );
}
