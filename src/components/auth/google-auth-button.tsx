import { signInWithGoogleAction } from "@/lib/actions/auth";
import { GoogleIcon } from "@/components/auth/google-icon";

/**
 * A plain form posting to a Server Action — no client JS required. The
 * action itself computes Supabase's OAuth URL and redirects the browser
 * to Google's consent screen.
 */
export function GoogleAuthButton({ next }: { next?: string }) {
  return (
    <form action={signInWithGoogleAction.bind(null, next)}>
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-3 rounded-sm border border-brass-dim/60 bg-surface-2 px-4 py-2.5 text-sm font-medium text-parchment transition-weighted hover:border-brass-dim hover:bg-surface-2/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
      >
        <GoogleIcon />
        Continue with Google
      </button>
    </form>
  );
}
