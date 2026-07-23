import { getTradingAccounts } from "@/lib/actions/accounts";
import { createTrade } from "@/lib/actions/trades";
import { TradeForm } from "@/components/trade-form";
import { NewAccountInline } from "@/components/new-account-inline";

export default async function NewTradePage() {
  const accounts = await getTradingAccounts();

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl text-ink">Log a trade</h1>

      {accounts.length === 0 ? (
        <NewAccountInline />
      ) : (
        <TradeForm
          tradingAccounts={accounts}
          action={createTrade}
          submitLabel="Log trade"
        />
      )}
    </div>
  );
}
