"use client";

import Link from "next/link";
import { LogOut, UserRound, Settings, ShieldCheck } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CurrentUser } from "@/lib/supabase/auth";

function initialsFor(user: CurrentUser) {
  const source = user.displayName || user.username || user.email;
  return source.slice(0, 2).toUpperCase();
}

export function UserMenu({ user }: { user: CurrentUser }) {
  const name = user.displayName ?? user.username ?? user.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
        <Avatar className="border border-brass-dim">
          {user.avatarUrl ? (
            <AvatarImage src={user.avatarUrl} alt="" />
          ) : null}
          <AvatarFallback className="font-label bg-surface-2 text-brass">
            {initialsFor(user)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 border border-brass-dim/40 bg-surface text-parchment"
      >
        <DropdownMenuLabel>
          <p className="font-body truncate text-sm text-parchment">{name}</p>
          <p className="font-body truncate text-xs font-normal text-parchment-dim">
            {user.email}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-brass-dim/30" />
        {user.username ? (
          <DropdownMenuItem render={<Link href={`/profile/${user.username}`} />}>
            <UserRound />
            View Profile
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem render={<Link href="/settings/profile" />}>
          <Settings />
          Edit Profile
        </DropdownMenuItem>
        {user.isAdmin ? (
          <DropdownMenuItem render={<Link href="/admin" />}>
            <ShieldCheck />
            Admin
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator className="bg-brass-dim/30" />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            void signOutAction();
          }}
        >
          <LogOut />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
