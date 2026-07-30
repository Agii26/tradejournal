import { notFound } from "next/navigation";
import { getTrade, updateTrade } from "@/lib/actions/trades";
import { getTradingAccounts } from "@/lib/actions/accounts";
import { getTagGroups } from "@/lib/actions/tags";
import { TradeForm } from "@/components/trade-form";

export default async function EditTradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [trade, accounts, tagGroups] = await Promise.all([
    getTrade(id),
    getTradingAccounts(),
    getTagGroups(),
  ]);
  if (!trade) notFound();

  const boundUpdate = updateTrade.bind(null, trade.id);

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl text-ink">Edit trade</h1>
      <TradeForm
        tradingAccounts={accounts}
        tagGroups={tagGroups}
        action={boundUpdate}
        submitLabel="Save changes"
        defaultSelectedTagIds={trade.tags.map((t) => t.id)}
        defaultValues={{
          tradingAccountId: trade.tradingAccount.id,
          symbol: trade.symbol,
          assetClass: trade.assetClass,
          direction: trade.direction,
          entryAt: trade.entryAt,
          exitAt: trade.exitAt,
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          quantity: trade.quantity,
          stopLoss: trade.stopLoss,
          target: trade.target,
          exitReason: trade.exitReason,
          riskAmount: trade.riskAmount,
          fees: trade.fees,
          setupGrade: trade.setupGrade,
          confidenceRating: trade.confidenceRating,
          followedPlan: trade.followedPlan,
          reflection: trade.reflection,
        }}
      />
    </div>
  );
}
