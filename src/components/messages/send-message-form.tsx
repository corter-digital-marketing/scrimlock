"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendMessageAction, type MessageActionState } from "@/lib/actions/messages";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initialState: MessageActionState = null;

export function SendMessageForm({
  recipientId,
  recipientUsername,
}: {
  recipientId: string;
  recipientUsername: string;
}) {
  const [state, formAction, pending] = useActionState(sendMessageAction, initialState);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error && textareaRef.current) {
      textareaRef.current.value = "";
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="recipientId" value={recipientId} />
      <input type="hidden" name="recipientUsername" value={recipientUsername} />

      {state?.error ? (
        <p
          role="alert"
          className="rounded-sm border border-oxblood/50 bg-oxblood/10 px-3 py-2 text-sm text-parchment"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex items-end gap-3">
        <Textarea
          ref={textareaRef}
          name="body"
          rows={2}
          maxLength={2000}
          placeholder="Write a message…"
          required
          className="border-brass-dim/60 bg-surface-2"
        />
        <Button
          type="submit"
          disabled={pending}
          className="bg-brass text-primary-foreground hover:bg-brass/90"
        >
          {pending ? "Sending…" : "Send"}
        </Button>
      </div>
    </form>
  );
}
