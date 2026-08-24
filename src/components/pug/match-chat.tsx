"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { sendMatchMessageAction } from "@/lib/actions/pug-matches";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
        <span className="font-label text-parchment-dim/60 text-[9px] tracking-widest uppercase">
          both teams
        </span>
      </div>

      <ul className="flex max-h-80 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <li className="font-body py-6 text-center text-sm text-parchment-dim">
            No messages yet — everyone in the match can see this.
          </li>
        ) : (
          messages.map((m) => {
            const isMine = m.sender_id === currentUserId;
            return (
              <li
                key={m.id}
                className={cn("flex items-end gap-2", isMine ? "flex-row-reverse" : "flex-row")}
              >
                <Avatar className="border-brass-dim/40 h-7 w-7 shrink-0 border">
                  {m.profile?.avatar_url ? <AvatarImage src={m.profile.avatar_url} alt="" /> : null}
                  <AvatarFallback className="font-label bg-surface-2 text-[9px] text-brass">
                    {(m.profile?.display_name ?? "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={cn("flex max-w-[75%] flex-col", isMine ? "items-end" : "items-start")}>
                  {!isMine ? (
                    <span className="font-label mb-0.5 text-[9px] tracking-widest text-parchment-dim uppercase">
                      {m.profile?.display_name ?? "Unknown"}
                    </span>
                  ) : null}
                  <div
                    className={cn(
                      "rounded-sm px-3 py-1.5 text-sm break-words",
                      isMine
                        ? "bg-brass/15 text-parchment"
                        : "border border-brass-dim/40 bg-surface-2 text-parchment",
                    )}
                  >
                    {m.body}
                  </div>
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
