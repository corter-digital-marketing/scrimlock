import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { PagePlaceholder } from "@/components/site/page-placeholder";

export default function NotFound() {
  return (
    <PagePlaceholder
      eyebrow="Error"
      title="404 — Page Not Found"
      description="The page you're looking for doesn't exist, or hasn't been built yet."
      phaseNote="If you followed a link from this site, it points at a route that's still on the build plan."
    >
      <Link
        href="/"
        className={cn(
          buttonVariants(),
          "bg-brass text-primary-foreground hover:bg-brass/90 mt-10",
        )}
      >
        Back to home
      </Link>
    </PagePlaceholder>
  );
}
