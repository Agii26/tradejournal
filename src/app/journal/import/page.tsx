import { getTradingAccounts } from "@/lib/actions/accounts";
import { CsvImportWizard } from "@/components/csv-import-wizard";

export default async function ImportPage() {
  const accounts = await getTradingAccounts();

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl text-ink">Import trades</h1>
      <p className="mb-8 text-sm text-muted">
        Built against Bitunix&rsquo;s Position History export (Wallet → Order Center → Futures
        orders → Position History → export), but works with any CSV that has a header row — map
        whatever columns your export has.
      </p>

      {accounts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-hairline px-6 py-16 text-center">
          <p className="text-ink">You need a trading account before importing.</p>
          <p className="mt-1 text-sm text-muted">Add one on the Accounts page first.</p>
        </div>
      ) : (
        <div className="max-w-4xl">
          <CsvImportWizard tradingAccounts={accounts} />
        </div>
      )}
    </div>
  );
}
