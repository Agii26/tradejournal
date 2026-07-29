import { getTradingAccounts } from "@/lib/actions/accounts";
import { createTrade } from "@/lib/actions/trades";
import { getTagGroups } from "@/lib/actions/tags";
import { TradeForm } from "@/components/trade-form";
import { NewAccountInline } from "@/components/new-account-inline";

export default async function NewTradePage() {
  const [accounts, tagGroups] = await Promise.all([getTradingAccounts(), getTagGroups()]);

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl text-ink">Log a trade</h1>

      {accounts.length === 0 ? (
        <NewAccountInline blocking />
      ) : (
        <div className="max-w-3xl">
          <TradeForm
            tradingAccounts={accounts}
            tagGroups={tagGroups}
            action={createTrade}
            submitLabel="Log trade"
          />
        </div>
      )}
    </div>
  );
}
