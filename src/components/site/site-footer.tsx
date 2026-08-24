import Link from "next/link";
import { Coffee } from "lucide-react";
import { SigilMark } from "@/components/site/sigil-mark";
import { primaryNavLinks, secondaryNavLinks } from "@/lib/nav-links";
import { PAYPAL_DONATE_URL } from "@/lib/site-config";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteFooter() {
  return (
    <footer className="relative z-0 border-t border-brass-dim/40 bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <SigilMark className="h-9 w-9 shrink-0 text-brass-dim" />
            <div>
              <p className="font-display text-base tracking-wide text-parchment">
                SCRIMLOCK
              </p>
              <p className="font-body mt-1 max-w-sm text-sm text-parchment-dim">
                An independent community hub for Deadlock competitive play.
                Not affiliated with or endorsed by Valve Corporation.
              </p>
              <Link
                href={PAYPAL_DONATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-brass text-primary-foreground hover:bg-brass/90 mt-5",
                )}
              >
                <Coffee className="h-4 w-4" />
                Buy Me a Coffee
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="font-label mb-3 text-xs tracking-widest text-brass-dim uppercase">
                Compete
              </p>
              <ul className="space-y-2">
                {primaryNavLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-body text-sm text-parchment-dim transition-weighted hover:text-brass"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-label mb-3 text-xs tracking-widest text-brass-dim uppercase">
                Community
              </p>
              <ul className="space-y-2">
                {secondaryNavLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-body text-sm text-parchment-dim transition-weighted hover:text-brass"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-brass-dim/20 pt-6 text-xs text-parchment-dim sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body">
            &copy; {new Date().getFullYear()} ScrimLock. Deadlock is a
            trademark of Valve Corporation.
          </p>
          <p className="font-label tracking-widest uppercase">
            Built by players, for players
          </p>
        </div>
      </div>
    </footer>
  );
}
