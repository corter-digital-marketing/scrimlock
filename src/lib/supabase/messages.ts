import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

export type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type MessageProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function findConversation(
  userId: string,
  otherId: string,
): Promise<ConversationRow | null> {
  if (!isSupabaseConfigured()) return null;

  const [userAId, userBId] = canonicalPair(userId, otherId);
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_a_id", userAId)
    .eq("user_b_id", userBId)
    .maybeSingle();

  return data ?? null;
}

export async function getMessages(conversationId: string): Promise<MessageRow[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return data ?? [];
}

export type ConversationSummary = {
  conversation: ConversationRow;
  otherUser: MessageProfile | null;
  lastMessage: MessageRow | null;
};

/** Inbox — one row per conversation, newest activity first. */
export async function getConversations(userId: string): Promise<ConversationSummary[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data: convos } = await supabase
    .from("conversations")
    .select("*")
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

  const rows = convos ?? [];
  if (rows.length === 0) return [];

  const otherIds = rows.map((c) => (c.user_a_id === userId ? c.user_b_id : c.user_a_id));

  const [{ data: profiles }, { data: recentMessages }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", otherIds),
    supabase
      .from("messages")
      .select("*")
      .in(
        "conversation_id",
        rows.map((c) => c.id),
      )
      .order("created_at", { ascending: false }),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const lastByConversation = new Map<string, MessageRow>();
  for (const m of recentMessages ?? []) {
    if (!lastByConversation.has(m.conversation_id)) {
      lastByConversation.set(m.conversation_id, m);
    }
  }

  return rows
    .map((c) => ({
      conversation: c,
      otherUser: profileById.get(c.user_a_id === userId ? c.user_b_id : c.user_a_id) ?? null,
      lastMessage: lastByConversation.get(c.id) ?? null,
    }))
    .sort((a, b) => {
      const at = a.lastMessage?.created_at ?? a.conversation.created_at;
      const bt = b.lastMessage?.created_at ?? b.conversation.created_at;
      return bt.localeCompare(at);
    });
}
