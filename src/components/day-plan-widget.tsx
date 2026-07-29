"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { upsertTodayDayPlan } from "@/lib/actions/day-plans";
import { moodOptions } from "@/lib/validation";
import { FormField, inputClass } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import type { PlainDayPlan } from "@/lib/actions/day-plans";

export function DayPlanWidget({ initialPlan }: { initialPlan: PlainDayPlan | null }) {
  const [state, formAction] = useActionState(upsertTodayDayPlan, undefined);
  const [expanded, setExpanded] = useState(false);
  const hasPlan = !!initialPlan;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [expanded]);

  const summary = hasPlan
    ? [
        initialPlan!.mood,
        initialPlan!.sleepScore != null ? `Sleep ${initialPlan!.sleepScore}/10` : null,
        initialPlan!.stressLevel != null ? `Stress ${initialPlan!.stressLevel}/10` : null,
      ]
        .filter(Boolean)
        .join(" · ") || "Logged"
    : null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-3 py-2 text-sm text-ink hover:bg-accent-tint cursor-pointer"
      >
        {hasPlan ? summary : "How are you feeling?"}
        <ChevronDown size={14} className={`text-muted transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-lg border border-hairline bg-surface shadow-[0_12px_32px_rgba(23,24,26,0.1)]">
          <form action={formAction} className="space-y-4 px-5 py-4">
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
        </div>
      )}
    </div>
  );
}

