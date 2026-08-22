import { SigilMark } from "@/components/site/sigil-mark";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <SigilMark className="h-12 w-12 animate-pulse text-brass-dim" />
      <p className="font-label text-xs tracking-[0.35em] text-parchment-dim uppercase">
        Loading
      </p>
    </div>
  );
}
