import { signInWithOAuthAction, type OAuthProvider } from "@/lib/actions/auth";
import { GoogleIcon } from "@/components/auth/google-icon";
import { DiscordIcon } from "@/components/auth/discord-icon";

const LABELS: Record<OAuthProvider, string> = {
  google: "Continue with Google",
  discord: "Continue with Discord",
};

const ICONS: Record<OAuthProvider, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  google: GoogleIcon,
  discord: DiscordIcon,
};

/**
 * A plain form posting to a Server Action — no client JS required. The
 * action itself computes Supabase's OAuth URL and redirects the browser
 * to the provider's consent screen.
 */
export function OAuthButton({
  provider,
  next,
}: {
  provider: OAuthProvider;
  next?: string;
}) {
  const Icon = ICONS[provider];

  return (
    <form action={signInWithOAuthAction.bind(null, provider, next)}>
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-3 rounded-sm border border-brass-dim/60 bg-surface-2 px-4 py-2.5 text-sm font-medium text-parchment transition-weighted hover:border-brass-dim hover:bg-surface-2/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
      >
        <Icon />
        {LABELS[provider]}
      </button>
    </form>
  );
}
