"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { tradingAccountSchema } from "@/lib/validation";

export interface PlainTradingAccount {
  id: string;
  name: string;
  broker: string | null;
  type: string;
  startingBalance: number;
  tradeCount: number;
}

export async function getTradingAccounts(): Promise<PlainTradingAccount[]> {
  const userId = await requireUserId();
  const accounts = await prisma.tradingAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { trades: true } } },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cascades from no generated Prisma client in this sandbox
  return accounts.map((a: any) => ({
    id: a.id,
    name: a.name,
    broker: a.broker,
    type: a.type,
    startingBalance: Number(a.startingBalance),
    tradeCount: a._count.trades,
  }));
}

export type ActionState = { error?: string } | undefined;

export async function createTradingAccount(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = tradingAccountSchema.safeParse({
    name: formData.get("name"),
    broker: formData.get("broker"),
    type: formData.get("type"),
    startingBalance: formData.get("startingBalance"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.tradingAccount.create({
    data: { ...parsed.data, userId },
  });

  revalidatePath("/journal");
  revalidatePath("/journal/new");
  revalidatePath("/journal/accounts");
  return undefined;
}

/** Called right after signup so there's always somewhere to log a trade against. */
export async function createDefaultTradingAccount(userId: string) {
  return prisma.tradingAccount.create({
    data: {
      userId,
      name: "Main",
      type: "LIVE",
      startingBalance: 0,
    },
  });
}
