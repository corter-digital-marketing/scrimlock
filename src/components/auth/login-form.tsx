"use client";

import { useActionState } from "react";
import { loginAction, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = null;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {state?.error ? (
        <p
          role="alert"
          className="rounded-sm border border-oxblood/50 bg-oxblood/10 px-3 py-2 text-sm text-parchment"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="email"
          className="font-label text-xs tracking-widest text-brass-dim uppercase"
        >
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="border-brass-dim/60 bg-surface-2"
          aria-invalid={!!state?.fieldErrors?.email}
        />
        {state?.fieldErrors?.email ? (
          <p className="text-xs text-oxblood">{state.fieldErrors.email[0]}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="password"
          className="font-label text-xs tracking-widest text-brass-dim uppercase"
        >
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="border-brass-dim/60 bg-surface-2"
          aria-invalid={!!state?.fieldErrors?.password}
        />
        {state?.fieldErrors?.password ? (
          <p className="text-xs text-oxblood">{state.fieldErrors.password[0]}</p>
        ) : null}
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="bg-brass text-primary-foreground hover:bg-brass/90 mt-2"
      >
        {pending ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}
