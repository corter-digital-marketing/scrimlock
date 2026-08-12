import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/site/page-placeholder";

export const metadata: Metadata = { title: "Scrims" };

export default function ScrimsPage() {
  return (
    <PagePlaceholder
      eyebrow="Arrangements"
      title="Scrims"
      description="Post 6v6 practice availability and find opponents by rank range, region, and time. Lands in Phase 5."
      phaseNote="This tab is wired into the nav now as a placeholder. Posting and responding to scrims arrives once teams exist."
    />
  );
}
