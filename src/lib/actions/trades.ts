"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { tradeSchema } from "@/lib/validation";
import { computeTradeMetrics } from "@/lib/trade-metrics";

export type ActionState = { error?: string } | undefined;

function parseTradeForm(formData: FormData) {
  return tradeSchema.safeParse({
    tradingAccountId: formData.get("tradingAccountId"),
    symbol: formData.get("symbol"),
    assetClass: formData.get("assetClass"),
    direction: formData.get("direction"),
    entryAt: formData.get("entryAt"),
    exitAt: formData.get("exitAt"),
    entryPrice: formData.get("entryPrice"),
    exitPrice: formData.get("exitPrice"),
    quantity: formData.get("quantity"),
    stopLoss: formData.get("stopLoss"),
    target: formData.get("target"),
    exitReason: formData.get("exitReason"),
    riskAmount: formData.get("riskAmount"),
    fees: formData.get("fees"),
    setupGrade: formData.get("setupGrade"),
  });
}

export async function createTrade(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = parseTradeForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const account = await prisma.tradingAccount.findFirst({
    where: { id: parsed.data.tradingAccountId, userId },
    select: { id: true },
  });
  if (!account) return { error: "That account isn't yours" };

  const metrics = computeTradeMetrics(parsed.data);

  const trade = await prisma.trade.create({
    data: { ...parsed.data, userId, ...metrics },
  });

  revalidatePath("/journal");
  redirect(`/journal/${trade.id}`);
}

export async function updateTrade(
  tradeId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();

  const existing = await prisma.trade.findFirst({
    where: { id: tradeId, userId },
    select: { id: true },
  });
  if (!existing) return { error: "Trade not found" };

  const parsed = parseTradeForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const account = await prisma.tradingAccount.findFirst({
    where: { id: parsed.data.tradingAccountId, userId },
    select: { id: true },
  });
  if (!account) return { error: "That account isn't yours" };

  const metrics = computeTradeMetrics(parsed.data);

  await prisma.trade.update({
    where: { id: tradeId },
    data: { ...parsed.data, ...metrics },
  });

  revalidatePath("/journal");
  revalidatePath(`/journal/${tradeId}`);
  redirect(`/journal/${tradeId}`);
}

export async function deleteTrade(tradeId: string): Promise<ActionState> {
  const userId = await requireUserId();

  const existing = await prisma.trade.findFirst({
    where: { id: tradeId, userId },
    select: { id: true },
  });
  if (!existing) return { error: "Trade not found" };

  await prisma.trade.delete({ where: { id: tradeId } });

  revalidatePath("/journal");
  redirect("/journal");
}

export interface PlainTradeListItem {
  id: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  assetClass: string;
  entryAt: Date;
  exitAt: Date | null;
  realizedR: number | null;
  tradingAccount: { name: string };
}

export interface PlainTradeDetail {
  id: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  assetClass: string;
  entryAt: Date;
  exitAt: Date | null;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  stopLoss: number | null;
  target: number | null;
  exitReason: string | null;
  riskAmount: number | null;
  plannedRR: number | null;
  realizedR: number | null;
  grossPnl: number | null;
  fees: number | null;
  netPnl: number | null;
  setupGrade: string | null;
  tradingAccount: { id: string; name: string; type: string };
  images: { id: string; url: string; kind: string | null }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tag UI lands in Phase 3
  tags: any[];
}

export async function getTrades(): Promise<PlainTradeListItem[]> {
  const userId = await requireUserId();
  const trades = await prisma.trade.findMany({
    where: { userId },
    orderBy: { entryAt: "desc" },
    include: { tradingAccount: { select: { name: true } }, images: { take: 1 } },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- same cause as toPlainTrade's any: no generated Prisma client in this sandbox
  return trades.map((t: any) => toPlainTrade(t) as PlainTradeListItem);
}

export async function getTrade(tradeId: string): Promise<PlainTradeDetail | null> {
  const userId = await requireUserId();
  const trade = await prisma.trade.findFirst({
    where: { id: tradeId, userId },
    include: {
      tradingAccount: true,
      images: { orderBy: { createdAt: "asc" } },
      tags: { include: { tag: true } },
    },
  });
  if (!trade) return null;
  return toPlainTrade(trade) as PlainTradeDetail;
}

/**
 * Prisma's Decimal fields are decimal.js instances server-side — they don't
 * survive the Server->Client Component boundary as-is, so every number that
 * might reach a Client Component gets converted here first.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPlainTrade(trade: any) {
  const decimalFields = [
    "entryPrice",
    "exitPrice",
    "quantity",
    "stopLoss",
    "target",
    "riskAmount",
    "plannedRR",
    "realizedR",
    "grossPnl",
    "fees",
    "netPnl",
  ] as const;

  const plain = { ...trade };
  for (const field of decimalFields) {
    if (plain[field] !== null && plain[field] !== undefined) {
      plain[field] = Number(plain[field]);
    }
  }
  if (plain.tradingAccount?.startingBalance !== undefined) {
    plain.tradingAccount = {
      ...plain.tradingAccount,
      startingBalance: Number(plain.tradingAccount.startingBalance),
    };
  }
  return plain;
}
