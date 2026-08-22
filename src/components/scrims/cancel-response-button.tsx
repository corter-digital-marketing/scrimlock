"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { cancelResponseAction } from "@/lib/actions/scrims";
import { Button } from "@/components/ui/button";

export function CancelResponseButton({ scrimId }: { scrimId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      className="border-brass-dim"
      onClick={() => {
        startTransition(async () => {
          const fd = new FormData();
          fd.set("scrimId", scrimId);
          const result = await cancelResponseAction(fd);
          if (result?.error) toast.error(result.error);
        });
      }}
    >
      {pending ? "Withdrawing…" : "Withdraw Response"}
    </Button>
  );
}
