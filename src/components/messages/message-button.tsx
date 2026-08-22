import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function MessageButton({
  username,
  className,
}: {
  username: string;
  className?: string;
}) {
  return (
    <Link
      href={`/messages/${username}`}
      className={cn(buttonVariants({ variant: "outline" }), "border-brass-dim", className)}
    >
      Message
    </Link>
  );
}
