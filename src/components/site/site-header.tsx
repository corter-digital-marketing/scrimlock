"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { SigilMark } from "@/components/site/sigil-mark";
import { primaryNavLinks, secondaryNavLinks } from "@/lib/nav-links";

function NavTab({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex flex-col items-center px-3 py-2 transition-weighted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-void rounded-sm",
      )}
    >
      <span
        className={cn(
          "font-display text-sm tracking-wide uppercase transition-weighted",
          active
            ? "text-brass text-glow-brass"
            : "text-parchment-dim group-hover:text-parchment",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "absolute -bottom-[1px] left-1/2 h-[2px] -translate-x-1/2 bg-brass transition-weighted",
          active ? "w-2/3" : "w-0 group-hover:w-1/3",
        )}
      />
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-brass-dim/40 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-sm"
        >
          <SigilMark className="h-8 w-8 text-brass" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg tracking-[0.08em] text-parchment">
              DEADLOCK
            </span>
            <span className="font-label text-[10px] tracking-[0.3em] text-verdigris uppercase">
              Esports
            </span>
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-stretch gap-1 md:flex"
        >
          {primaryNavLinks.map((link) => (
            <NavTab key={link.href} {...link} active={isActive(link.href)} />
          ))}
          <span
            aria-hidden="true"
            className="mx-2 my-2 w-px bg-brass-dim/40"
          />
          {secondaryNavLinks.map((link) => (
            <NavTab key={link.href} {...link} active={isActive(link.href)} />
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "text-parchment hover:bg-surface-2 hover:text-brass",
            )}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className={cn(
              buttonVariants(),
              "bg-brass text-primary-foreground hover:bg-brass/90 shadow-[0_0_0_1px_var(--brass-dim)]",
            )}
          >
            Sign Up
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-sm p-2 text-parchment hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Primary"
          className="border-t border-brass-dim/40 bg-surface px-4 pt-2 pb-4 md:hidden"
        >
          <ul className="flex flex-col divide-y divide-brass-dim/20">
            {[...primaryNavLinks, ...secondaryNavLinks].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "font-display block py-3 text-base tracking-wide uppercase",
                    isActive(link.href) ? "text-brass" : "text-parchment-dim",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-brass-dim",
              )}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className={cn(
                buttonVariants(),
                "bg-brass text-primary-foreground hover:bg-brass/90",
              )}
            >
              Sign Up
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
