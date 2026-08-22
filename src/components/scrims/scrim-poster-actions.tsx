"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { cancelScrimAction, deleteScrimAction } from "@/lib/actions/scrims";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ScrimPosterActions({ scrimId }: { scrimId: string }) {
  const [pending, startTransition] = useTransition();

  function cancel() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("scrimId", scrimId);
      const result = await cancelScrimAction(fd);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        className="border-brass-dim"
        onClick={cancel}
      >
        Cancel Scrim
      </Button>

      <Dialog>
        <DialogTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="border-oxblood/60 text-oxblood hover:bg-oxblood/10"
            />
          }
        >
          Delete Scrim
        </DialogTrigger>
        <DialogContent className="border border-brass-dim/40 bg-surface text-parchment">
          <DialogHeader>
            <DialogTitle className="font-display text-parchment">
              Delete this scrim?
            </DialogTitle>
            <DialogDescription className="text-parchment-dim">
              This removes the post and every response. This can&apos;t be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" className="border-brass-dim" />}>
              Cancel
            </DialogClose>
            <form action={deleteScrimAction}>
              <input type="hidden" name="scrimId" value={scrimId} />
              <Button
                type="submit"
                className="bg-oxblood text-destructive-foreground hover:bg-oxblood/90 w-full"
              >
                Delete Scrim
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
