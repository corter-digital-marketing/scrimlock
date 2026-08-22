"use client";

const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

/**
 * `scheduled_for` etc. are stored UTC — critical for scrims/tournaments to
 * render in *the viewer's* timezone, not the server's. `Intl` needs the
 * browser's locale/timezone, which doesn't exist during SSR, so the server
 * render is a dash; `suppressHydrationWarning` lets the client's real
 * value replace it post-hydration without React flagging the mismatch.
 */
export function LocalDateTime({
  value,
  options = DEFAULT_OPTIONS,
  className,
}: {
  value: string;
  options?: Intl.DateTimeFormatOptions;
  className?: string;
}) {
  const formatted =
    typeof window === "undefined"
      ? null
      : new Date(value).toLocaleString(undefined, options);

  return (
    <span className={className} suppressHydrationWarning>
      {formatted ?? "—"}
    </span>
  );
}
