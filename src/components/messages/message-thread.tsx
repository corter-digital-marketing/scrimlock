import { cn } from "@/lib/utils";
import { LocalDateTime } from "@/components/site/local-datetime";
import type { MessageRow } from "@/lib/supabase/messages";

export function MessageThread({
  messages,
  currentUserId,
}: {
  messages: MessageRow[];
  currentUserId: string;
}) {
  if (messages.length === 0) {
    return (
      <p className="font-body py-8 text-center text-sm text-parchment-dim">
        No messages yet — say hello.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3 py-4">
      {messages.map((message) => {
        const isMine = message.sender_id === currentUserId;
        return (
          <li
            key={message.id}
            className={cn("flex flex-col", isMine ? "items-end" : "items-start")}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-sm px-3.5 py-2 text-sm break-words",
                isMine
                  ? "bg-brass/15 text-parchment"
                  : "border border-brass-dim/40 bg-surface-2 text-parchment",
              )}
            >
              {message.body}
            </div>
            <span className="font-label mt-1 text-[10px] tracking-widest text-parchment-dim uppercase">
              <LocalDateTime
                value={message.created_at}
                options={{ dateStyle: "short", timeStyle: "short" }}
              />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
