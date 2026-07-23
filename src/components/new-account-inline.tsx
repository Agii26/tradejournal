"use client";

import { useActionState } from "react";
import { createTradingAccount } from "@/lib/actions/accounts";
import { FormField, inputClass } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { tradingAccountTypes } from "@/lib/validation";

export function NewAccountInline() {
  const [state, formAction] = useActionState(createTradingAccount, undefined);

  return (
    <div className="rounded-lg border border-hairline bg-surface px-6 py-6">
      <p className="mb-4 text-sm text-muted">
        No trading accounts yet — add one before logging your first trade.
      </p>
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name" htmlFor="name">
            <input id="name" name="name" required placeholder="Main" className={inputClass} />
          </FormField>
          <FormField label="Type" htmlFor="type">
            <select id="type" name="type" required defaultValue="LIVE" className={inputClass}>
              {tradingAccountTypes.map((t) => (
                <option key={t} value={t}>
                  {t === "PROP_FIRM" ? "Prop firm" : t.charAt(0) + t.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Broker" htmlFor="broker" hint="Optional">
            <input id="broker" name="broker" className={inputClass} />
          </FormField>
          <FormField label="Starting balance" htmlFor="startingBalance">
            <input
              id="startingBalance"
              name="startingBalance"
              type="number"
              step="any"
              defaultValue={0}
              className={`${inputClass} tabular-nums`}
            />
          </FormField>
        </div>
        {state?.error && <p className="text-sm text-error">{state.error}</p>}
        <SubmitButton pendingText="Creating…">Create account</SubmitButton>
      </form>
    </div>
  );
}
