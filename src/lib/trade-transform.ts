/**
 * Prisma's Decimal fields are decimal.js instances server-side — they don't
 * survive the Server->Client Component boundary as-is, so every number that
 * might reach a Client Component gets converted here first.
 *
 * Deliberately NOT in a "use server" file: this is synchronous, and every
 * export from a "use server" file is required to be async (Next.js treats
 * them all as Server Actions). Keep this here, import it into action files
 * instead of moving it back — that's what broke the production build once.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toPlainTrade(trade: any) {
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
