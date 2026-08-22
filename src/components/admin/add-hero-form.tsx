"use client";

import { useActionState, useEffect, useRef } from "react";
import { addHeroAction, type AdminActionState } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AdminActionState = null;

export function AddHeroForm() {
  const [state, formAction, pending] = useActionState(addHeroAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error && !state?.fieldErrors) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name" className="font-label text-xs tracking-widest text-brass-dim uppercase">
          New hero
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Hero name"
          required
          className="border-brass-dim/60 bg-surface-2"
          aria-invalid={!!state?.fieldErrors?.name}
        />
        {state?.fieldErrors?.name ? (
          <p className="text-xs text-oxblood">{state.fieldErrors.name[0]}</p>
        ) : null}
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="bg-brass text-primary-foreground hover:bg-brass/90"
      >
        {pending ? "Adding…" : "Add"}
      </Button>
    </form>
  );
}
