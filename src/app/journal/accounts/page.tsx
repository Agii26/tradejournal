import { getTradingAccounts } from "@/lib/actions/accounts";
import { NewAccountInline } from "@/components/new-account-inline";

const TYPE_LABELS: Record<string, string> = {
  LIVE: "Live",
  DEMO: "Demo",
  PROP_FIRM: "Prop firm",
};

export default async function AccountsPage() {
  const accounts = await getTradingAccounts();

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl text-ink">Accounts</h1>
      <p className="mb-8 text-sm text-muted">
        Every trade belongs to one of these — add a demo or prop firm account any time.
      </p>

      {accounts.length > 0 && (
        <div className="mb-8 space-y-2">
          {accounts.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-lg border border-hairline bg-surface px-5 py-4"
            >
              <div>
                <div className="flex items-center gap-2 text-[15px] text-ink">
                  {a.name}
                  <span className="rounded-full bg-accent-tint px-2 py-0.5 text-xs text-accent">
                    {TYPE_LABELS[a.type] ?? a.type}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted">
                  {a.broker ? `${a.broker} · ` : ""}
                  {a.tradeCount} trade{a.tradeCount === 1 ? "" : "s"} · starting balance{" "}
                  {a.startingBalance >= 0 ? "" : "-"}${Math.abs(a.startingBalance).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-3 text-sm font-medium text-ink">Add an account</h2>
      <NewAccountInline />
    </div>
  );
}
