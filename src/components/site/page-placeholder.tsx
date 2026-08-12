import type { ReactNode } from "react";
import { SigilMark } from "@/components/site/sigil-mark";
import { DecoDivider } from "@/components/site/deco-divider";

/**
 * Shared shell for tab landing pages that aren't built yet (Phase 1 ships
 * these as themed placeholders; each phase replaces one with real content).
 */
export function PagePlaceholder({
  eyebrow,
  title,
  description,
  phaseNote,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  phaseNote: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <SigilMark
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 text-brass opacity-[0.04]"
      />
      <div className="relative flex flex-col items-center text-center">
        <p className="font-label text-xs tracking-[0.35em] text-verdigris uppercase">
          {eyebrow}
        </p>
        <h1 className="font-display mt-3 text-4xl tracking-tight text-parchment sm:text-5xl">
          {title}
        </h1>
        <p className="font-body mt-5 max-w-xl text-lg text-parchment-dim">
          {description}
        </p>

        <DecoDivider className="mt-10 w-full max-w-sm" />

        <div className="frame-brass mt-10 w-full max-w-md rounded-sm bg-surface px-6 py-8">
          <p className="font-label text-xs tracking-widest text-brass uppercase">
            Case pending
          </p>
          <p className="font-body mt-3 text-sm text-parchment-dim">
            {phaseNote}
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
