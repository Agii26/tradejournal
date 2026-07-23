"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/lib/actions/auth";
import { FormField, inputClass } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";

export default function SignupPage() {
  const [state, formAction] = useActionState(signup, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <FormField label="Name" htmlFor="name">
        <input id="name" name="name" type="text" required autoComplete="name" className={inputClass} />
      </FormField>
      <FormField label="Email" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </FormField>
      <FormField label="Password" htmlFor="password" hint="At least 8 characters">
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </FormField>

      {state?.error && <p className="text-sm text-error">{state.error}</p>}

      <SubmitButton className="w-full" pendingText="Creating account…">
        Create account
      </SubmitButton>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
