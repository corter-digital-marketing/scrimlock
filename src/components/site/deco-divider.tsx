import { cn } from "@/lib/utils";

/**
 * Thin double-rule deco separator with a diamond centerpiece, used between
 * major sections in place of a plain <hr> (§6).
 */
export function DecoDivider({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("flex items-center gap-3 text-brass-dim", className)}
    >
      <span className="h-px flex-1 bg-current opacity-60" />
      <span className="h-2 w-2 rotate-45 border border-current" />
      <span className="h-px w-10 bg-current opacity-60" />
      <span className="h-2 w-2 rotate-45 border border-current" />
      <span className="h-px flex-1 bg-current opacity-60" />
    </div>
  );
}
