import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/site/page-placeholder";

export const metadata: Metadata = { title: "LFT" };

export default function LftPage() {
  return (
    <PagePlaceholder
      eyebrow="Notices"
      title="Looking For Team"
      description="Players advertise rank, preferred heroes, and region. Teams post open slots. Lands in Phase 4."
      phaseNote="This tab is wired into the nav now as a placeholder. The player finder and team finder views arrive once profiles and teams exist."
    />
  );
}
