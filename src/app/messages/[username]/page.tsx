import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getProfileByUsername } from "@/lib/supabase/profiles";
import { findConversation, getMessages } from "@/lib/supabase/messages";
import { MessageThread } from "@/components/messages/message-thread";
import { SendMessageForm } from "@/components/messages/send-message-form";
import { ThreadAutoRefresh } from "@/components/messages/thread-auto-refresh";
import { DecoDivider } from "@/components/site/deco-divider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Params = Promise<{ username: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}` };
}

export const dynamic = "force-dynamic";

export default async function MessageThreadPage({ params }: { params: Params }) {
  const { username } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/messages/${username}`);

  const otherProfile = await getProfileByUsername(username);
  if (!otherProfile) notFound();
  if (otherProfile.id === user.id) redirect("/messages");

  const conversation = await findConversation(user.id, otherProfile.id);
  const messages = conversation ? await getMessages(conversation.id) : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <ThreadAutoRefresh />

      <div className="flex items-center justify-center gap-3 text-center">
        <Avatar className="border border-brass-dim/50">
          {otherProfile.avatar_url ? (
            <AvatarImage src={otherProfile.avatar_url} alt="" />
          ) : null}
          <AvatarFallback className="font-label bg-surface-2 text-xs text-brass">
            {otherProfile.display_name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="text-left">
          <h1 className="font-display text-2xl text-parchment">
            {otherProfile.display_name}
          </h1>
          <p className="font-label text-xs tracking-widest text-parchment-dim uppercase">
            @{otherProfile.username}
          </p>
        </div>
      </div>

      <DecoDivider className="mt-8" />

      <div className="frame-brass mt-8 flex flex-col rounded-sm bg-surface px-4 py-4 sm:px-6">
        <MessageThread messages={messages} currentUserId={user.id} />
        <SendMessageForm recipientId={otherProfile.id} recipientUsername={otherProfile.username} />
      </div>
    </div>
  );
}
