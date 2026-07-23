export type Direction = "LONG" | "SHORT";

export interface TradeMetricsInput {
  direction: Direction;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  stopLoss?: number;
  target?: number;
  riskAmount?: number;
  fees?: number;
}

export interface TradeMetrics {
  grossPnl?: number;
  netPnl?: number;
  realizedR?: number;
  plannedRR?: number;
}

/** Rounds to avoid float noise like 1.0499999999999998 showing up in a UI. */
function round(n: number, dp = 2) {
  const f = 10 ** dp;
  return Math.round((n + Number.EPSILON) * f) / f;
}

export function computeTradeMetrics(input: TradeMetricsInput): TradeMetrics {
  const { direction, entryPrice, exitPrice, quantity, stopLoss, target, riskAmount, fees } = input;

  let grossPnl: number | undefined;
  if (typeof exitPrice === "number" && !Number.isNaN(exitPrice)) {
    const diff = direction === "LONG" ? exitPrice - entryPrice : entryPrice - exitPrice;
    grossPnl = round(diff * quantity);
  }

  const netPnl = typeof grossPnl === "number" ? round(grossPnl - (fees ?? 0)) : undefined;

  const realizedR =
    typeof netPnl === "number" && riskAmount && riskAmount > 0
      ? round(netPnl / riskAmount, 2)
      : undefined;

  let plannedRR: number | undefined;
  if (typeof stopLoss === "number" && typeof target === "number") {
    const riskDist = Math.abs(entryPrice - stopLoss);
    const rewardDist = Math.abs(target - entryPrice);
    if (riskDist > 0) plannedRR = round(rewardDist / riskDist, 2);
  }

  return { grossPnl, netPnl, realizedR, plannedRR };
}
