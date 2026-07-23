"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { tradingAccountSchema } from "@/lib/validation";

export async function getTradingAccounts() {
  const userId = await requireUserId();
  return prisma.tradingAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
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
