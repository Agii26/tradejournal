"use client";

import { useActionState, useState } from "react";
import { ChevronDown } from "lucide-react";
import { upsertTodayDayPlan } from "@/lib/actions/day-plans";
import { moodOptions } from "@/lib/validation";
import { FormField, inputClass } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import type { PlainDayPlan } from "@/lib/actions/day-plans";

export function DayPlanWidget({ initialPlan }: { initialPlan: PlainDayPlan | null }) {
  const [state, formAction] = useActionState(upsertTodayDayPlan, undefined);
  const [expanded, setExpanded] = useState(!initialPlan);
  const hasPlan = !!initialPlan;

  return (
    <div className="rounded-lg border border-hairline bg-surface">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left cursor-pointer"
      >
        <span className="text-sm font-medium text-ink">
          {hasPlan ? "Today's check-in" : "How are you feeling today?"}
        </span>
        <ChevronDown size={15} className={`text-muted transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {hasPlan && !expanded && (
        <p className="px-4 pb-3 text-xs text-muted">
          {[
            initialPlan!.mood,
            initialPlan!.sleepScore != null ? `Sleep ${initialPlan!.sleepScore}/10` : null,
            initialPlan!.stressLevel != null ? `Stress ${initialPlan!.stressLevel}/10` : null,
          ]
            .filter(Boolean)
            .join(" · ") || "Logged"}
        </p>
      )}

      {expanded && (
        <form action={formAction} className="space-y-4 border-t border-hairline px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Sleep" htmlFor="sleepScore" hint="1–10">
              <input
                id="sleepScore"
                name="sleepScore"
                type="number"
                min={1}
                max={10}
                defaultValue={initialPlan?.sleepScore ?? undefined}
                className={`${inputClass} tabular-nums`}
              />
            </FormField>
            <FormField label="Stress" htmlFor="stressLevel" hint="1–10">
              <input
                id="stressLevel"
                name="stressLevel"
                type="number"
                min={1}
                max={10}
                defaultValue={initialPlan?.stressLevel ?? undefined}
                className={`${inputClass} tabular-nums`}
              />
            </FormField>
          </div>
          <FormField label="Mood" htmlFor="mood">
            <select id="mood" name="mood" defaultValue={initialPlan?.mood ?? ""} className={inputClass}>
              <option value="">—</option>
              {moodOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Notes" htmlFor="notes" hint="Anything affecting how you'll trade today — optional">
            <textarea
              id="notes"
              name="notes"
              rows={2}
              defaultValue={initialPlan?.notes ?? undefined}
              className={inputClass}
            />
          </FormField>
          {state?.error && <p className="text-sm text-error">{state.error}</p>}
          <SubmitButton pendingText="Saving…">{hasPlan ? "Update" : "Save"}</SubmitButton>
        </form>
      )}
    </div>
  );
}
