"use client";

import Link from "next/link";
import { Bug, Coffee } from "lucide-react";
import { BugReportForm } from "@/components/site/bug-report-form";
import { PAYPAL_DONATE_URL } from "@/lib/site-config";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * The two footer CTAs every page should carry: report a bug (a compact
 * box that opens the real BugReportForm in a dialog, rather than
 * repeating a full form in every page's footer) and buy the dev a
 * coffee. Split out of SiteFooter because the dialog needs client
 * interactivity and the rest of the footer doesn't.
 */
export function FooterCallouts() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="frame-brass rounded-sm bg-surface p-5">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-oxblood" strokeWidth={1.5} />
          <p className="font-label text-xs tracking-widest text-brass-dim uppercase">
            Found a Bug?
          </p>
        </div>
        <p className="font-body mt-2 text-sm text-parchment-dim">
          ScrimLock is in beta — something&apos;s going to break. Tell me
          what happened and I&apos;ll fix it.
        </p>
        <Dialog>
          <DialogTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className="border-brass-dim mt-4"
              />
            }
          >
            Report a Bug
          </DialogTrigger>
          <DialogContent className="border border-brass-dim/40 bg-surface text-parchment sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-parchment">
                Found a bug or an issue?
              </DialogTitle>
              <DialogDescription className="text-parchment-dim">
                Tell me what happened and I&apos;ll fix it.
              </DialogDescription>
            </DialogHeader>
            <BugReportForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="frame-brass rounded-sm bg-surface p-5">
        <div className="flex items-center gap-2">
          <Coffee className="h-4 w-4 text-brass" strokeWidth={1.5} />
          <p className="font-label text-xs tracking-widest text-brass-dim uppercase">
            Enjoying ScrimLock?
          </p>
        </div>
        <p className="font-body mt-2 text-sm text-parchment-dim">
          It&apos;s free and ad-free. If it&apos;s useful, a coffee keeps it
          that way.
        </p>
        <Link
          href={PAYPAL_DONATE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants(), "bg-brass text-primary-foreground hover:bg-brass/90 mt-4")}
        >
          <Coffee className="h-4 w-4" />
          Buy Me a Coffee
        </Link>
      </div>
    </div>
  );
}
