"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { withdrawAction } from "@/lib/actions/tournaments";
import { Button } from "@/components/ui/button";

export function WithdrawButton({
  tournamentId,
  registrationId,
}: {
  tournamentId: string;
  registrationId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      className="border-oxblood/60 text-oxblood hover:bg-oxblood/10"
      onClick={() => {
        startTransition(async () => {
          const fd = new FormData();
          fd.set("tournamentId", tournamentId);
          fd.set("registrationId", registrationId);
          const result = await withdrawAction(fd);
          if (result?.error) toast.error(result.error);
        });
      }}
    >
      {pending ? "Withdrawing…" : "Withdraw"}
    </Button>
  );
}
