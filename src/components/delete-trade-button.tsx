"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

export function DeleteTradeButton({
  tradeId,
  action,
}: {
  tradeId: string;
  action: (tradeId: string) => Promise<{ error?: string } | undefined>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted">Delete this trade?</span>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await action(tradeId);
              if (result?.error) setError(result.error);
            })
          }
          className="font-medium text-error hover:underline cursor-pointer disabled:opacity-50"
        >
          {isPending ? "Deleting…" : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-muted hover:text-ink cursor-pointer"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-3 py-1.5 text-sm text-muted hover:border-error hover:text-error cursor-pointer"
      >
        <Trash2 size={13} /> Delete
      </button>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
