import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getConversations } from "@/lib/supabase/messages";
import { DecoDivider } from "@/components/site/deco-divider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const metadata: Metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function MessagesInboxPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/messages");

  const conversations = await getConversations(user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="text-center">
        <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
          Correspondence
        </p>
        <h1 className="font-display mt-3 text-4xl text-parchment">Messages</h1>
      </div>

      <DecoDivider className="mt-8" />

      <div className="frame-brass mt-10 rounded-sm bg-surface px-2 py-2 sm:px-4">
        {conversations.length === 0 ? (
          <p className="font-body px-4 py-8 text-center text-sm text-parchment-dim">
            No conversations yet. Message someone from their profile or team
            page to get started.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-brass-dim/15">
            {conversations.map(({ conversation, otherUser, lastMessage }) => (
              <li key={conversation.id}>
                <Link
                  href={`/messages/${otherUser?.username ?? ""}`}
                  className="flex items-center gap-3 rounded-sm px-3 py-3 transition-weighted hover:bg-surface-2"
                >
                  <Avatar className="border border-brass-dim/50">
                    {otherUser?.avatar_url ? (
                      <AvatarImage src={otherUser.avatar_url} alt="" />
                    ) : null}
                    <AvatarFallback className="font-label bg-surface-2 text-xs text-brass">
                      {(otherUser?.display_name ?? "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-body truncate text-sm text-parchment">
                      {otherUser?.display_name ?? "Unknown"}
                    </p>
                    {lastMessage ? (
                      <p className="font-body truncate text-xs text-parchment-dim">
                        {lastMessage.body}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
