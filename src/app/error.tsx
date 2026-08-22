"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PagePlaceholder } from "@/components/site/page-placeholder";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PagePlaceholder
      eyebrow="Error"
      title="Something Went Wrong"
      description="That page hit a snag on our end. Try again, or head back to the lobby."
      phaseNote={
        error.digest
          ? `Reference: ${error.digest}`
          : "If this keeps happening, it's worth reporting."
      }
    >
      <Button
        type="button"
        onClick={reset}
        className="bg-brass text-primary-foreground hover:bg-brass/90 mt-10"
      >
        Try Again
      </Button>
    </PagePlaceholder>
  );
}
