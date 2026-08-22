import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getFriends, getIncomingFriendRequests } from "@/lib/supabase/friends";
import { FriendRequestsList } from "@/components/friends/friend-requests-list";
import { DecoDivider } from "@/components/site/deco-divider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const metadata: Metadata = { title: "Friends" };
export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/friends");

  const [requests, friends] = await Promise.all([
    getIncomingFriendRequests(user.id),
    getFriends(user.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="text-center">
        <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
          Your circle
        </p>
        <h1 className="font-display mt-3 text-4xl text-parchment">Friends</h1>
      </div>

      <DecoDivider className="mt-8" />

      <div className="frame-brass mt-10 rounded-sm bg-surface px-6 py-8 sm:px-10">
        <p className="font-label mb-4 text-xs tracking-widest text-brass-dim uppercase">
          Requests
        </p>
        <FriendRequestsList requests={requests} />
      </div>

      <div className="frame-brass mt-8 rounded-sm bg-surface px-6 py-8 sm:px-10">
        <p className="font-label mb-4 text-xs tracking-widest text-brass-dim uppercase">
          Friends ({friends.length})
        </p>
        {friends.length === 0 ? (
          <p className="font-body text-sm text-parchment-dim">
            No friends yet — visit a profile and add one.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-brass-dim/20">
            {friends.map((friend) => (
              <li key={friend.id} className="flex items-center gap-3 py-3">
                <Avatar className="border border-brass-dim/50">
                  {friend.avatar_url ? (
                    <AvatarImage src={friend.avatar_url} alt="" />
                  ) : null}
                  <AvatarFallback className="font-label bg-surface-2 text-xs text-brass">
                    {friend.display_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Link
                  href={`/profile/${friend.username}`}
                  className="font-body text-sm text-parchment hover:text-brass"
                >
                  {friend.display_name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
