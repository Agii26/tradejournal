"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { computeAnalytics, type TradeForStats, type AnalyticsStats } from "@/lib/analytics";

export async function getAnalytics(): Promise<AnalyticsStats> {
  const userId = await requireUserId();

  const trades = await prisma.trade.findMany({
    where: { userId },
    select: {
      id: true,
      symbol: true,
      direction: true,
      entryAt: true,
      exitAt: true,
      netPnl: true,
      realizedR: true,
      setupGrade: true,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cascades from no generated Prisma client in this sandbox
  const forStats: TradeForStats[] = trades.map((t: any) => ({
    id: t.id,
    symbol: t.symbol,
    direction: t.direction,
    entryAt: t.entryAt,
    exitAt: t.exitAt,
    netPnl: t.netPnl === null ? null : Number(t.netPnl),
    realizedR: t.realizedR === null ? null : Number(t.realizedR),
    setupGrade: t.setupGrade,
  }));

  return computeAnalytics(forStats);
}
