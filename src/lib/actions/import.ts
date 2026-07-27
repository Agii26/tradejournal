"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { computeTradeMetrics } from "@/lib/trade-metrics";

export interface ImportRowInput {
  symbol: string;
  direction: "LONG" | "SHORT";
  entryAt: Date;
  entryPrice: number;
  quantity: number;
  exitAt?: Date;
  exitPrice?: number;
  netPnl?: number; // if the export already reports it, trust it over recomputing
  fees?: number;
  stopLoss?: number;
  target?: number;
  exitReason?: string;
}

export interface ImportResult {
  imported: number;
  failed: { row: number; reason: string }[];
}

export async function bulkImportTrades(
  tradingAccountId: string,
  rows: ImportRowInput[]
): Promise<ImportResult> {
  const userId = await requireUserId();

  const account = await prisma.tradingAccount.findFirst({
    where: { id: tradingAccountId, userId },
    select: { id: true },
  });
  if (!account) {
    return { imported: 0, failed: rows.map((_, i) => ({ row: i + 1, reason: "Account not found" })) };
  }

  const failed: { row: number; reason: string }[] = [];
  let imported = 0;

  // Sequential, not Promise.all — a batch of hundreds of concurrent inserts
  // against a pooled serverless connection is more likely to exhaust the
  // pool than to actually go faster, and this only runs once per import.
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const metrics = computeTradeMetrics({
        direction: row.direction,
        entryPrice: row.entryPrice,
        exitPrice: row.exitPrice,
        quantity: row.quantity,
        stopLoss: row.stopLoss,
        target: row.target,
        fees: row.fees,
      });

      await prisma.trade.create({
        data: {
          userId,
          tradingAccountId,
          symbol: row.symbol.toUpperCase().trim(),
          assetClass: "CRYPTO",
          direction: row.direction,
          entryAt: row.entryAt,
          exitAt: row.exitAt,
          entryPrice: row.entryPrice,
          exitPrice: row.exitPrice,
          quantity: row.quantity,
          stopLoss: row.stopLoss,
          target: row.target,
          exitReason: row.exitReason,
          fees: row.fees,
          // Prefer the exchange's own reported P&L over our recomputed one
          // when the export provides it — it accounts for things (funding,
          // partial fills) our formula doesn't know about.
          grossPnl: row.netPnl !== undefined ? row.netPnl + (row.fees ?? 0) : metrics.grossPnl,
          netPnl: row.netPnl ?? metrics.netPnl,
          plannedRR: metrics.plannedRR,
        },
      });
      imported += 1;
    } catch (err) {
      failed.push({
        row: i + 1,
        reason: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  revalidatePath("/journal");
  revalidatePath("/journal/analytics");
  return { imported, failed };
}
