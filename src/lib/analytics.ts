export interface TradeForStats {
  id: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  entryAt: Date;
  exitAt: Date | null;
  netPnl: number | null;
  realizedR: number | null;
  setupGrade: string | null;
}

export interface EquityPoint {
  tradeId: string;
  date: string; // ISO date of exit
  cumulative: number;
}

export interface HistogramBucket {
  label: string;
  count: number;
}

export interface StreakInfo {
  type: "win" | "loss" | "none";
  count: number;
}

export interface AnalyticsStats {
  totalTrades: number;
  closedCount: number;
  openCount: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number | null; // 0-100, null if no closed trades
  profitFactor: number | null; // null if no trades; Infinity if losses sum to 0 but wins exist
  expectancy: number | null; // avg netPnl per closed trade, in dollars
  avgRMultiple: number | null; // avg realizedR across trades that have one
  maxDrawdown: number; // dollars, always >= 0
  longestWinStreak: number;
  longestLossStreak: number;
  currentStreak: StreakInfo;
  equityCurve: EquityPoint[];
  rMultipleHistogram: HistogramBucket[];
  dailyPnl: { date: string; pnl: number }[]; // one entry per day that has closed trades
  bestTrades: TradeForStats[];
  worstTrades: TradeForStats[];
}

function round(n: number, dp = 2) {
  const f = 10 ** dp;
  return Math.round((n + Number.EPSILON) * f) / f;
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

const R_BUCKETS: { max: number; label: string }[] = [
  { max: -2, label: "≤ -2R" },
  { max: -1, label: "-2R to -1R" },
  { max: 0, label: "-1R to 0R" },
  { max: 1, label: "0R to 1R" },
  { max: 2, label: "1R to 2R" },
  { max: 3, label: "2R to 3R" },
  { max: Infinity, label: "> 3R" },
];

function bucketForR(r: number): string {
  for (const b of R_BUCKETS) {
    if (r <= b.max) return b.label;
  }
  return R_BUCKETS[R_BUCKETS.length - 1].label;
}

export function computeAnalytics(trades: TradeForStats[]): AnalyticsStats {
  const closed = trades.filter((t) => t.exitAt !== null && t.netPnl !== null);
  const open = trades.filter((t) => t.exitAt === null || t.netPnl === null);

  // Sort closed trades chronologically by exit date for streaks/equity curve —
  // entry order isn't the same thing once trades overlap.
  const chronological = [...closed].sort(
    (a, b) => (a.exitAt as Date).getTime() - (b.exitAt as Date).getTime()
  );

  const wins = closed.filter((t) => (t.netPnl as number) > 0);
  const losses = closed.filter((t) => (t.netPnl as number) < 0);
  const breakevens = closed.filter((t) => (t.netPnl as number) === 0);

  const winRate = closed.length > 0 ? round((wins.length / closed.length) * 100, 1) : null;

  const grossWin = wins.reduce((sum, t) => sum + (t.netPnl as number), 0);
  const grossLossAbs = Math.abs(losses.reduce((sum, t) => sum + (t.netPnl as number), 0));
  const profitFactor =
    closed.length === 0 ? null : grossLossAbs === 0 ? (grossWin > 0 ? Infinity : null) : round(grossWin / grossLossAbs, 2);

  const expectancy =
    closed.length > 0
      ? round(closed.reduce((sum, t) => sum + (t.netPnl as number), 0) / closed.length, 2)
      : null;

  const withR = closed.filter((t) => t.realizedR !== null);
  const avgRMultiple =
    withR.length > 0
      ? round(withR.reduce((sum, t) => sum + (t.realizedR as number), 0) / withR.length, 2)
      : null;

  // Equity curve + max drawdown: running cumulative P&L in exit order.
  let cumulative = 0;
  let peak = 0;
  let maxDrawdown = 0;
  const equityCurve: EquityPoint[] = [];
  for (const t of chronological) {
    cumulative += t.netPnl as number;
    equityCurve.push({ tradeId: t.id, date: dateKey(t.exitAt as Date), cumulative: round(cumulative) });
    if (cumulative > peak) peak = cumulative;
    const drawdown = peak - cumulative;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  maxDrawdown = round(maxDrawdown);

  // Streaks: win vs. non-win (loss or breakeven treated the same — a
  // breakeven trade isn't a win, and folding it in with losses avoids an
  // ambiguous three-way streak that's harder to reason about and act on).
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let runType: "win" | "loss" | "none" = "none";
  let runCount = 0;
  for (const t of chronological) {
    const isWin = (t.netPnl as number) > 0;
    if (isWin === (runType === "win") && runType !== "none") {
      runCount += 1;
    } else {
      runType = isWin ? "win" : "loss";
      runCount = 1;
    }
    if (runType === "win") longestWinStreak = Math.max(longestWinStreak, runCount);
    else longestLossStreak = Math.max(longestLossStreak, runCount);
  }
  const currentStreak: StreakInfo = chronological.length === 0 ? { type: "none", count: 0 } : { type: runType, count: runCount };

  // R-multiple histogram — only trades where a realizedR could be computed.
  const bucketCounts = new Map<string, number>(R_BUCKETS.map((b) => [b.label, 0]));
  for (const t of withR) {
    const label = bucketForR(t.realizedR as number);
    bucketCounts.set(label, (bucketCounts.get(label) ?? 0) + 1);
  }
  const rMultipleHistogram: HistogramBucket[] = R_BUCKETS.map((b) => ({
    label: b.label,
    count: bucketCounts.get(b.label) ?? 0,
  }));

  // Daily P&L for the calendar heatmap.
  const dailyMap = new Map<string, number>();
  for (const t of closed) {
    const key = dateKey(t.exitAt as Date);
    dailyMap.set(key, round((dailyMap.get(key) ?? 0) + (t.netPnl as number)));
  }
  const dailyPnl = [...dailyMap.entries()]
    .map(([date, pnl]) => ({ date, pnl }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const byNetPnlDesc = [...closed].sort((a, b) => (b.netPnl as number) - (a.netPnl as number));
  const bestTrades = byNetPnlDesc.slice(0, 5);
  const worstTrades = byNetPnlDesc.slice(-5).reverse();

  return {
    totalTrades: trades.length,
    closedCount: closed.length,
    openCount: open.length,
    wins: wins.length,
    losses: losses.length,
    breakevens: breakevens.length,
    winRate,
    profitFactor,
    expectancy,
    avgRMultiple,
    maxDrawdown,
    longestWinStreak,
    longestLossStreak,
    currentStreak,
    equityCurve,
    rMultipleHistogram,
    dailyPnl,
    bestTrades,
    worstTrades,
  };
}
