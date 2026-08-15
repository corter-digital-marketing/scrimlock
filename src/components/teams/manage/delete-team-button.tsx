"use client";

import { deleteTeamAction } from "@/lib/actions/teams";
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

export function DeleteTeamButton({
  teamId,
  teamName,
}: {
  teamId: string;
  teamName: string;
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
        Delete Team
      </DialogTrigger>
      <DialogContent className="border border-brass-dim/40 bg-surface text-parchment">
        <DialogHeader>
          <DialogTitle className="font-display text-parchment">
            Delete {teamName}?
          </DialogTitle>
          <DialogDescription className="text-parchment-dim">
            This removes the team and its entire roster. This can&apos;t be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" className="border-brass-dim" />}>
            Cancel
          </DialogClose>
          <form action={deleteTeamAction}>
            <input type="hidden" name="teamId" value={teamId} />
            <Button
              type="submit"
              className="bg-oxblood text-destructive-foreground hover:bg-oxblood/90 w-full"
            >
              Delete Team
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
