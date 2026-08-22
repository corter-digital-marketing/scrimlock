"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-fetches the page every few seconds while queued or mid-match, since
 * matchmaking and vote resolution only progress when someone's page load
 * or action nudges them — there's no background job runner behind this. */
export function PugAutoRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
