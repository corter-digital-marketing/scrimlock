"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function LobbyCodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be denied — the code is still selectable text.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="frame-brass transition-weighted group flex w-full items-center justify-between gap-3 rounded-sm bg-void px-5 py-3.5 hover:bg-void/70 focus-visible:ring-2 focus-visible:ring-brass focus-visible:outline-none"
    >
      <span className="font-label truncate text-lg tracking-[0.15em] text-brass select-all">
        {code}
      </span>
      <span className="font-label text-parchment-dim group-hover:text-brass flex shrink-0 items-center gap-1.5 text-[10px] tracking-widest uppercase transition-colors">
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-verdigris" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copy
          </>
        )}
      </span>
    </button>
  );
}
