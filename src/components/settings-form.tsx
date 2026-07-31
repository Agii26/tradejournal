"use client";

import { useActionState } from "react";
import { updateUserSettings } from "@/lib/actions/profile";
import type { PlainUserSettings } from "@/lib/actions/profile";
import { FormField, inputClass } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";

export function SettingsForm({ initial }: { initial: PlainUserSettings }) {
  const [state, formAction] = useActionState(updateUserSettings, undefined);

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-lg border border-hairline bg-surface px-5 py-5"
    >
      <FormField
        label="Username"
        htmlFor="username"
        hint="Lowercase, letters/numbers/underscore/hyphen, 3-20 characters"
      >
        <input
          id="username"
          name="username"
          defaultValue={initial.username ?? ""}
          placeholder="e.g. benzon"
          className={inputClass}
        />
      </FormField>

      <label className="flex cursor-pointer items-start gap-3 rounded-md border border-hairline px-4 py-3">
        <input
          type="checkbox"
          name="isPublicProfile"
          defaultChecked={initial.isPublicProfile}
          className="mt-0.5 accent-accent"
        />
        <span>
          <span className="block text-sm font-medium text-ink">Public profile</span>
          <span className="mt-0.5 block text-xs text-muted">
            Anyone who searches your username sees your trades. Mark individual trades
            private any time to exclude just those. The profile page itself isn&rsquo;t live
            yet — this just sets it up for when it is.
          </span>
        </span>
      </label>

      {state?.error && <p className="text-sm text-error">{state.error}</p>}
      {state?.success && <p className="text-sm text-accent">Saved.</p>}

      <SubmitButton pendingText="Saving…">Save settings</SubmitButton>
    </form>
  );
}
