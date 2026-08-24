"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { sendMatchMessageAction } from "@/lib/actions/pug-matches";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { MatchMessageEntry } from "@/lib/supabase/pug-matches";

export function MatchChat({
  matchId,
  messages,
  currentUserId,
}: {
  matchId: string;
  messages: MatchMessageEntry[];
  currentUserId: string;
}) {
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function send(formData: FormData) {
    const body = formData.get("body");
    if (typeof body !== "string" || !body.trim()) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("matchId", matchId);
      fd.set("body", body);
      const result = await sendMatchMessageAction(fd);
      if (result?.error) {
        toast.error(result.error);
      } else if (textareaRef.current) {
        textareaRef.current.value = "";
      }
    });
  }

  return (
    <div className="frame-brass flex h-full min-h-96 flex-col rounded-sm bg-surface">
      <div className="flex items-center justify-center gap-2 border-b border-brass-dim/30 px-4 py-3">
        <MessageCircle className="h-3.5 w-3.5 text-brass-dim" strokeWidth={1.5} />
        <p className="font-label text-xs tracking-widest text-brass-dim uppercase">
          Match Chat
        </p>
      </div>

      <ul className="flex max-h-80 flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <li className="font-body py-6 text-center text-sm text-parchment-dim">
            No messages yet — coordinate with your team.
          </li>
        ) : (
          messages.map((m) => {
            const isMine = m.sender_id === currentUserId;
            return (
              <li
                key={m.id}
                className={cn("flex flex-col", isMine ? "items-end" : "items-start")}
              >
                {!isMine ? (
                  <span className="font-label mb-0.5 text-[9px] tracking-widest text-parchment-dim uppercase">
                    {m.profile?.display_name ?? "Unknown"}
                  </span>
                ) : null}
                <div
                  className={cn(
                    "max-w-[85%] rounded-sm px-3 py-1.5 text-sm break-words",
                    isMine
                      ? "bg-brass/15 text-parchment"
                      : "border border-brass-dim/40 bg-surface-2 text-parchment",
                  )}
                >
                  {m.body}
                </div>
              </li>
            );
          })
        )}
      </ul>

      <form action={send} className="flex items-end gap-2 border-t border-brass-dim/30 p-3">
        <Textarea
          ref={textareaRef}
          name="body"
          rows={1}
          maxLength={500}
          placeholder="Say something…"
          required
          className="min-h-9 resize-none border-brass-dim/60 bg-surface-2"
        />
        <Button
          type="submit"
          size="sm"
          disabled={pending}
          className="bg-brass text-primary-foreground hover:bg-brass/90"
        >
          {pending ? "…" : "Send"}
        </Button>
      </form>
    </div>
  );
}
