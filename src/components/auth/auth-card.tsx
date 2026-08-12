import type { ReactNode } from "react";
import { SigilMark } from "@/components/site/sigil-mark";

export function AuthCard({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-4rem-1px)] max-w-lg items-center px-4 py-16 sm:px-6">
      <SigilMark
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 text-brass opacity-[0.04]"
      />
      <div className="frame-brass relative w-full rounded-sm bg-surface px-6 py-8 sm:px-10 sm:py-10">
        <p className="font-label text-center text-xs tracking-[0.35em] text-verdigris uppercase">
          {eyebrow}
        </p>
        <h1 className="font-display mt-3 text-center text-3xl text-parchment">
          {title}
        </h1>
        <p className="font-body mt-2 text-center text-sm text-parchment-dim">
          {description}
        </p>

        <div className="mt-8">{children}</div>

        {footer ? (
          <p className="font-body mt-8 text-center text-sm text-parchment-dim">
            {footer}
          </p>
        ) : null}
      </div>
    </div>
  );
}
