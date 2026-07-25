import { getAnalytics } from "@/lib/actions/analytics";
import { StatCard } from "@/components/stat-card";
import { EquityCurveChart } from "@/components/equity-curve-chart";
import { CalendarHeatmap } from "@/components/calendar-heatmap";
import { RMultipleHistogram } from "@/components/r-multiple-histogram";
import { BestWorstList } from "@/components/best-worst-list";

function fmtMoney(n: number | null): string {
  if (n === null) return "—";
  return `${n >= 0 ? "+" : ""}$${n.toFixed(2)}`;
}

function fmtPercent(n: number | null): string {
  if (n === null) return "—";
  return `${n}%`;
}

function fmtRatio(n: number | null): string {
  if (n === null) return "—";
  if (!Number.isFinite(n)) return "∞";
  return n.toFixed(2);
}

function fmtR(n: number | null): string {
  if (n === null) return "—";
  return `${n >= 0 ? "+" : ""}${n}R`;
}

export default async function AnalyticsPage() {
  const stats = await getAnalytics();

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl text-ink">Analytics</h1>
      <p className="mb-8 text-sm text-muted">
        {stats.closedCount} closed trade{stats.closedCount === 1 ? "" : "s"}
        {stats.openCount > 0 ? ` · ${stats.openCount} still open` : ""}
      </p>

      {stats.closedCount === 0 ? (
        <div className="rounded-lg border border-dashed border-hairline px-6 py-16 text-center">
          <p className="text-ink">Nothing to analyze yet.</p>
          <p className="mt-1 text-sm text-muted">
            Close out a trade or two and the numbers will show up here.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <StatCard label="Win rate" value={fmtPercent(stats.winRate)} hint={`${stats.wins}W / ${stats.losses}L`} />
            <StatCard label="Profit factor" value={fmtRatio(stats.profitFactor)} />
            <StatCard label="Expectancy" value={fmtMoney(stats.expectancy)} hint="per trade" />
            <StatCard label="Max drawdown" value={`-$${stats.maxDrawdown.toFixed(2)}`} />
            <StatCard label="Avg R-multiple" value={fmtR(stats.avgRMultiple)} />
          </div>

          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard
              label="Current streak"
              value={
                stats.currentStreak.type === "none"
                  ? "—"
                  : `${stats.currentStreak.count} ${stats.currentStreak.type}${stats.currentStreak.count === 1 ? "" : "s"}`
              }
            />
            <StatCard label="Longest win streak" value={String(stats.longestWinStreak)} />
            <StatCard label="Longest loss streak" value={String(stats.longestLossStreak)} />
          </div>

          <h2 className="mb-3 text-sm font-medium text-ink">Equity curve</h2>
          <div className="mb-8">
            <EquityCurveChart data={stats.equityCurve} />
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h2 className="mb-3 text-sm font-medium text-ink">Daily P&amp;L</h2>
              <CalendarHeatmap data={stats.dailyPnl} />
            </div>
            <div>
              <h2 className="mb-3 text-sm font-medium text-ink">R-multiple distribution</h2>
              <RMultipleHistogram data={stats.rMultipleHistogram} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <BestWorstList title="Best trades" trades={stats.bestTrades} />
            <BestWorstList title="Worst trades" trades={stats.worstTrades} />
          </div>
        </>
      )}
    </div>
  );
}
