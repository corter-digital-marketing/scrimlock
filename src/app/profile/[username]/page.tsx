import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfileByUsername } from "@/lib/supabase/profiles";
import { getHeroesByIds } from "@/lib/supabase/heroes";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getFriendship, getFriends } from "@/lib/supabase/friends";
import { getRankById } from "@/lib/ranks";
import { RankBadge } from "@/components/site/rank-badge";
import { PugLetterBadge } from "@/components/pug/pug-letter-badge";
import { DecoDivider } from "@/components/site/deco-divider";
import { FriendButton } from "@/components/profile/friend-button";
import { MessageButton } from "@/components/messages/message-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Params = Promise<{ username: string }>;

// Without this, Next statically caches this route per-username — a
// request that raced a brand-new profile's creation (or any other
// timing edge case) gets its notFound() response cached and keeps
// serving that stale 404 forever, even once the row genuinely exists.
// Every other dynamic-segment page in the app already opts out; this
// one was just missed.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}` };
}

export default async function ProfilePage({ params }: { params: Params }) {
  const { username } = await params;
  const [profile, currentUser] = await Promise.all([
    getProfileByUsername(username),
    getCurrentUser(),
  ]);

  if (!profile) notFound();

  const [preferredHeroes, friends, friendship] = await Promise.all([
    getHeroesByIds(profile.preferred_heroes),
    getFriends(profile.id),
    currentUser && currentUser.id !== profile.id
      ? getFriendship(currentUser.id, profile.id)
      : Promise.resolve(null),
  ]);
  const rank = getRankById(profile.rank_id);
  const isOwnProfile = currentUser?.id === profile.id;
  const socialLinks = (
    [
      ["YouTube", profile.youtube_url],
      ["Twitch", profile.twitch_url],
      ["StatLocker", profile.statlocker_url],
      ["X", profile.x_url],
      ["Instagram", profile.instagram_url],
    ] satisfies [string, string | null][]
  )
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([label, url]) => ({ label, url }));
  const initials = (profile.display_name || profile.username)
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="frame-brass rounded-sm bg-surface px-6 py-8 sm:px-10">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
          <Avatar className="h-24 w-24 border border-brass-dim">
            {profile.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt="" />
            ) : null}
            <AvatarFallback className="font-display bg-surface-2 text-3xl text-brass">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-3xl text-parchment">
                  {profile.display_name}
                </h1>
                <p className="font-label text-xs tracking-widest text-parchment-dim uppercase">
                  @{profile.username}
                </p>
              </div>
              {isOwnProfile ? (
                <Link
                  href="/settings/profile"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "border-brass-dim",
                  )}
                >
                  Edit Profile
                </Link>
              ) : currentUser ? (
                <div className="flex gap-2">
                  <MessageButton username={profile.username} />
                  <FriendButton
                    profileId={profile.id}
                    profileUsername={profile.username}
                    currentUserId={currentUser.id}
                    friendship={friendship}
                  />
                </div>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {profile.is_lft ? (
                <span className="font-label rounded-full border border-verdigris bg-verdigris/10 px-2.5 py-1 text-[10px] tracking-widest text-verdigris uppercase">
                  Looking for team
                </span>
              ) : null}
              {profile.region ? (
                <span className="font-label rounded-full border border-brass-dim/50 px-2.5 py-1 text-[10px] tracking-widest text-parchment-dim uppercase">
                  {profile.region}
                </span>
              ) : null}
              {profile.discord_handle ? (
                <span className="font-label rounded-full border border-brass-dim/50 px-2.5 py-1 text-[10px] tracking-widest text-parchment-dim uppercase">
                  Discord: {profile.discord_handle}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {profile.bio ? (
          <p className="font-body mt-6 text-parchment-dim">{profile.bio}</p>
        ) : null}

        {socialLinks.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-3">
            {socialLinks.map(({ label, url }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="font-label rounded-full border border-brass-dim/50 px-3 py-1 text-[10px] tracking-widest text-parchment-dim uppercase transition-weighted hover:border-brass hover:text-brass"
              >
                {label}
              </a>
            ))}
          </div>
        ) : null}

        <DecoDivider className="my-8" />

        <div className="grid gap-8 sm:grid-cols-[auto_auto_1fr]">
          <div>
            <p className="font-label mb-3 text-xs tracking-widest text-brass-dim uppercase">
              Rank
            </p>
            {rank ? (
              <RankBadge
                rankName={rank.name}
                iconSrc={rank.icon}
                subrank={profile.rank_subrank}
                size="lg"
              />
            ) : (
              <p className="font-body text-sm text-parchment-dim">Not set</p>
            )}
          </div>

          <div>
            <p className="font-label mb-3 text-xs tracking-widest text-brass-dim uppercase">
              PUG Rank
            </p>
            <div className="flex flex-col items-center gap-1.5">
              <PugLetterBadge elo={profile.pug_elo} size="lg" />
              <span className="font-label text-parchment-dim text-[10px] tracking-widest uppercase">
                {profile.pug_elo} ELO
              </span>
            </div>
          </div>

          <div>
            <p className="font-label mb-3 text-xs tracking-widest text-brass-dim uppercase">
              Preferred heroes
            </p>
            {preferredHeroes.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {preferredHeroes.map((hero) => (
                  <span
                    key={hero.id}
                    className="font-label rounded-full border border-brass-dim/50 px-2.5 py-1 text-[11px] tracking-wide text-parchment uppercase"
                  >
                    {hero.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="font-body text-sm text-parchment-dim">
                None listed
              </p>
            )}

            {profile.playstyle_note ? (
              <p className="font-body mt-3 text-sm text-parchment-dim italic">
                &ldquo;{profile.playstyle_note}&rdquo;
              </p>
            ) : null}
          </div>
        </div>

        {friends.length > 0 ? (
          <>
            <DecoDivider className="my-8" />
            <div>
              <p className="font-label mb-3 text-xs tracking-widest text-brass-dim uppercase">
                Friends ({friends.length})
              </p>
              <div className="flex flex-wrap gap-4">
                {friends.map((friend) => (
                  <Link
                    key={friend.id}
                    href={`/profile/${friend.username}`}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <Avatar className="border border-brass-dim/50">
                      {friend.avatar_url ? (
                        <AvatarImage src={friend.avatar_url} alt="" />
                      ) : null}
                      <AvatarFallback className="font-label bg-surface-2 text-xs text-brass">
                        {friend.display_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-label max-w-16 truncate text-[10px] tracking-widest text-parchment-dim uppercase">
                      {friend.display_name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
