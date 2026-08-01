"use client";

import { useActionState, useState } from "react";
import { Check, Copy } from "lucide-react";
import { updateUserSettings } from "@/lib/actions/profile";
import type { PlainUserSettings } from "@/lib/actions/profile";
import { FormField, inputClass } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";

export function SettingsForm({
  initial,
  profileUrl,
}: {
  initial: PlainUserSettings;
  profileUrl: string | null;
}) {
  const [state, formAction] = useActionState(updateUserSettings, undefined);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!profileUrl) return;
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-5">
      {profileUrl && (
        <div className="rounded-lg border border-hairline bg-surface px-5 py-4">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-ink">Your profile link</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                initial.isPublicProfile ? "bg-accent-tint text-accent" : "bg-ink/10 text-muted"
              }`}
            >
              {initial.isPublicProfile ? "Live" : "Not public yet"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={profileUrl}
              onFocus={(e) => e.target.select()}
              className={`${inputClass} text-muted`}
            />
            <button
              type="button"
              onClick={copyLink}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-hairline px-3 text-sm text-ink hover:bg-accent-tint cursor-pointer"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

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
              Anyone who searches your username sees your trades, except ones you mark
              private individually. Turn this off any time to pull everything back to
              private.
            </span>
          </span>
        </label>

        {state?.error && <p className="text-sm text-error">{state.error}</p>}
        {state?.success && <p className="text-sm text-accent">Saved.</p>}

        <SubmitButton pendingText="Saving…">Save settings</SubmitButton>
      </form>
    </div>
  );
}
