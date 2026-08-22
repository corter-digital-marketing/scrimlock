"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { postLobbyCodeAction } from "@/lib/actions/pug-matches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LobbyCodeForm({ matchId }: { matchId: string }) {
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState("");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paste the custom lobby code"
        className="w-64 border-brass-dim/60 bg-surface-2"
      />
      <Button
        type="button"
        disabled={pending || !code.trim()}
        className="bg-brass text-primary-foreground hover:bg-brass/90"
        onClick={() => {
          startTransition(async () => {
            const fd = new FormData();
            fd.set("matchId", matchId);
            fd.set("lobbyCode", code);
            const result = await postLobbyCodeAction(fd);
            if (result?.error) toast.error(result.error);
          });
        }}
      >
        {pending ? "Saving…" : "Post Code"}
      </Button>
    </div>
  );
}
