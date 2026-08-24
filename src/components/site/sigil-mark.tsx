import type { SVGProps } from "react";

/**
 * A small geometric arcane sigil — used as the wordmark glyph and, scaled up
 * and near-transparent, as a watermark behind hero panels. Never placed
 * behind body text (§6).
 */
export function SigilMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.1}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="32" cy="32" r="29" strokeWidth={1.2} />
      <circle cx="32" cy="32" r="22" strokeWidth={0.6} opacity={0.7} />
      <path
        d="M32 8 L53.4 44 H10.6 Z"
        strokeWidth={1}
        strokeLinejoin="round"
      />
      <path
        d="M32 56 L10.6 20 H53.4 Z"
        strokeWidth={0.6}
        opacity={0.55}
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="4.5" strokeWidth={1} />
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * Math.PI * 2) / 12;
        // Rounded to 3 decimals — Math.cos/sin can differ in their last
        // few digits between the server's and the browser's JS engine
        // (ordinary cross-platform libm variance), which was enough to
        // fail hydration since React compares the exact attribute
        // string. 3 decimals is far more precision than a 64-unit
        // viewBox needs, and guarantees server and client agree.
        const round = (n: number) => Math.round(n * 1000) / 1000;
        const x1 = round(32 + Math.cos(angle) * 26);
        const y1 = round(32 + Math.sin(angle) * 26);
        const x2 = round(32 + Math.cos(angle) * 29);
        const y2 = round(32 + Math.sin(angle) * 29);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={0.8} />
        );
      })}
    </svg>
  );
}
