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
    <div className="mb-8 rounded-lg border border-hairline bg-surface">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left cursor-pointer"
      >
        <span className="text-sm font-medium text-ink">
          {hasPlan ? "Today's check-in" : "How are you feeling today?"}
        </span>
        <div className="flex items-center gap-3">
          {hasPlan && !expanded && (
            <span className="text-xs text-muted">
              {[
                initialPlan.mood,
                initialPlan.sleepScore != null ? `Sleep ${initialPlan.sleepScore}/10` : null,
                initialPlan.stressLevel != null ? `Stress ${initialPlan.stressLevel}/10` : null,
              ]
                .filter(Boolean)
                .join(" · ") || "Logged"}
            </span>
          )}
          <ChevronDown size={15} className={`text-muted transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {expanded && (
        <form action={formAction} className="space-y-4 border-t border-hairline px-5 py-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
            <FormField label="Mood" htmlFor="mood">
              <select
                id="mood"
                name="mood"
                defaultValue={initialPlan?.mood ?? ""}
                className={inputClass}
              >
                <option value="">—</option>
                {moodOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
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
