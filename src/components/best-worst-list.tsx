import Link from "next/link";
import type { TradeForStats } from "@/lib/analytics";

export function BestWorstList({
  title,
  trades,
}: {
  title: string;
  trades: TradeForStats[];
}) {
  return (
    <div className="rounded-lg border border-hairline bg-surface px-4 py-4">
      <h3 className="mb-2 text-sm font-medium text-ink">{title}</h3>
      {trades.length === 0 ? (
        <p className="text-sm text-muted">Nothing here yet</p>
      ) : (
        <ul className="space-y-1.5">
          {trades.map((t) => (
            <li key={t.id}>
              <Link
                href={`/journal/${t.id}`}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent-tint"
              >
                <span className="text-ink">{t.symbol}</span>
                <span
                  className={`tabular-nums ${(t.netPnl ?? 0) >= 0 ? "text-accent" : "text-error"}`}
                >
                  {(t.netPnl ?? 0) >= 0 ? "+" : ""}${t.netPnl}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
