import Link from "next/link";
import { Plus } from "lucide-react";
import { getTrades } from "@/lib/actions/trades";

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function JournalPage() {
  const trades = await getTrades();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">Journal</h1>
        <Link
          href="/journal/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-canvas hover:opacity-90"
        >
          <Plus size={15} /> Log trade
        </Link>
      </div>

      {trades.length === 0 ? (
        <div className="rounded-lg border border-dashed border-hairline px-6 py-16 text-center">
          <p className="text-ink">No trades logged yet.</p>
          <p className="mt-1 text-sm text-muted">
            Every setup, every mistake — start with your next one.
          </p>
          <Link
            href="/journal/new"
            className="mt-4 inline-block text-sm text-accent hover:underline"
          >
            Log your first trade →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {trades.map((t) => (
            <Link
              key={t.id}
              href={`/journal/${t.id}`}
              className="block rounded-lg border border-hairline bg-surface px-5 py-4 transition-colors hover:border-accent"
            >
              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-2 text-[15px] font-medium text-ink">
                  {t.symbol}
                  <span className="rounded-full bg-accent-tint px-2 py-0.5 text-xs font-normal text-accent">
                    {t.direction === "LONG" ? "Long" : "Short"}
                  </span>
                  <span className="text-xs text-muted">{t.tradingAccount.name}</span>
                </div>
                <div className="tabular-nums text-lg font-medium text-ink">
                  {t.realizedR !== null && t.realizedR !== undefined
                    ? `${t.realizedR > 0 ? "+" : ""}${t.realizedR}R`
                    : t.exitAt
                      ? "—"
                      : "Open"}
                </div>
              </div>
              <div className="mt-2 text-xs text-muted">
                {formatDate(t.entryAt)} · {t.assetClass}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
