import Link from "next/link";
import { cn } from "@/lib/utils";
import type { RegistrationEntry } from "@/lib/supabase/tournaments";

export function ParticipantList({ registrations }: { registrations: RegistrationEntry[] }) {
  const visible = registrations.filter((r) => r.status !== "withdrawn");

  if (visible.length === 0) {
    return (
      <p className="font-body text-sm text-parchment-dim">No registrations yet.</p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-brass-dim/20">
      {visible.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-3 py-3">
          {r.team ? (
            <Link href={`/teams/${r.team.id}`} className="font-body text-sm text-parchment hover:text-brass">
              {r.team.name} [{r.team.tag}]
            </Link>
          ) : r.profile ? (
            <Link
              href={`/profile/${r.profile.username}`}
              className="font-body text-sm text-parchment hover:text-brass"
            >
              {r.profile.display_name}
            </Link>
          ) : (
            <span className="font-body text-sm text-parchment-dim">Unknown</span>
          )}
          <span
            className={cn(
              "font-label text-[10px] tracking-widest uppercase",
              r.status === "confirmed" ? "text-verdigris" : "text-parchment-dim",
            )}
          >
            {r.status}
          </span>
        </li>
      ))}
    </ul>
  );
}
