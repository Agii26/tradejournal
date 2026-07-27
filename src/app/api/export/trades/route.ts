import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const COLUMNS = [
  "symbol",
  "assetClass",
  "direction",
  "entryAt",
  "exitAt",
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
  "setupGrade",
  "exitReason",
] as const;

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = value instanceof Date ? value.toISOString() : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const trades = await prisma.trade.findMany({
    where: { userId: session.user.id },
    orderBy: { entryAt: "asc" },
    include: { tradingAccount: { select: { name: true } } },
  });

  const header = ["account", ...COLUMNS].join(",");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cascades from no generated Prisma client in this sandbox
  const rows = trades.map((t: any) =>
    [csvEscape(t.tradingAccount.name), ...COLUMNS.map((c) => csvEscape(t[c]))].join(",")
  );
  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tradejournal-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
