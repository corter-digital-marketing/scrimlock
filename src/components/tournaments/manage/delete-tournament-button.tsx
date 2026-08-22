"use client";

import { deleteTournamentAction } from "@/lib/actions/tournaments";
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

export function DeleteTournamentButton({
  tournamentId,
  title,
}: {
  tournamentId: string;
  title: string;
}) {
  return (
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
        Delete Tournament
      </DialogTrigger>
      <DialogContent className="border border-brass-dim/40 bg-surface text-parchment">
        <DialogHeader>
          <DialogTitle className="font-display text-parchment">
            Delete {title}?
          </DialogTitle>
          <DialogDescription className="text-parchment-dim">
            This removes the tournament and every registration. This
            can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" className="border-brass-dim" />}>
            Cancel
          </DialogClose>
          <form action={deleteTournamentAction}>
            <input type="hidden" name="tournamentId" value={tournamentId} />
            <Button
              type="submit"
              className="bg-oxblood text-destructive-foreground hover:bg-oxblood/90 w-full"
            >
              Delete Tournament
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
