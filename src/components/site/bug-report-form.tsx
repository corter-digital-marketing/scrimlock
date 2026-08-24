"use client";

import { useActionState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { reportBugAction, type BugReportActionState } from "@/lib/actions/bug-report";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: BugReportActionState = null;

export function BugReportForm() {
  const [state, formAction, pending] = useActionState(reportBugAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  if (state?.success) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="h-8 w-8 text-verdigris" strokeWidth={1.5} />
        <p className="font-body text-parchment">
          Thanks — got it. I&apos;ll take a look.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="pageUrl" value={pathname} />

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="bug-email"
          className="font-label text-xs tracking-widest text-brass-dim uppercase"
        >
          Email (optional, if you want a reply)
        </Label>
        <Input
          id="bug-email"
          name="email"
          type="email"
          autoComplete="email"
          className="border-brass-dim/60 bg-surface-2"
          aria-invalid={!!state?.fieldErrors?.email}
        />
        {state?.fieldErrors?.email ? (
          <p className="text-xs text-oxblood">{state.fieldErrors.email[0]}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="bug-message"
          className="font-label text-xs tracking-widest text-brass-dim uppercase"
        >
          What happened?
        </Label>
        <Textarea
          id="bug-message"
          name="message"
          rows={4}
          maxLength={2000}
          placeholder="Describe the bug or issue — what you were doing, what you expected, what happened instead."
          required
          className="border-brass-dim/60 bg-surface-2"
          aria-invalid={!!state?.fieldErrors?.message}
        />
        {state?.fieldErrors?.message ? (
          <p className="text-xs text-oxblood">{state.fieldErrors.message[0]}</p>
        ) : null}
      </div>

      {state?.error ? (
        <p
          role="alert"
          className="rounded-sm border border-oxblood/50 bg-oxblood/10 px-3 py-2 text-sm text-parchment"
        >
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="bg-brass text-primary-foreground hover:bg-brass/90"
      >
        {pending ? "Sending…" : "Send Report"}
      </Button>
    </form>
  );
}
