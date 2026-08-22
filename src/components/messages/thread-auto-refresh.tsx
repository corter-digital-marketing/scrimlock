"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * No realtime subscription (yet) — this just re-fetches the Server
 * Component tree every few seconds while the thread is the active tab,
 * so a reply shows up without a manual reload. Cheap enough for a DM
 * thread; upgrading to Supabase Realtime is the natural next step if
 * this needs to feel more instant.
 */
export function ThreadAutoRefresh({ intervalMs = 8000 }: { intervalMs?: number }) {
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
