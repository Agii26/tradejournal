import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { getTrade, deleteTrade } from "@/lib/actions/trades";
import { ImageUpload } from "@/components/image-upload";
import { DeleteTradeButton } from "@/components/delete-trade-button";

function formatDateTime(d: string | Date) {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trade = await getTrade(id);
  if (!trade) notFound();

  const stat = (label: string, value: string | number | null | undefined, suffix = "") => (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="tabular-nums text-[15px] text-ink">
        {value === null || value === undefined || value === "" ? "—" : `${value}${suffix}`}
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl text-ink">{trade.symbol}</h1>
            <span className="rounded-full bg-accent-tint px-2.5 py-0.5 text-xs text-accent">
              {trade.direction === "LONG" ? "Long" : "Short"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {trade.tradingAccount.name} · {trade.assetClass} · {formatDateTime(trade.entryAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/journal/${trade.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-3 py-1.5 text-sm text-ink hover:bg-accent-tint"
          >
            <Pencil size={13} /> Edit
          </Link>
          <DeleteTradeButton tradeId={trade.id} action={deleteTrade} />
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-hairline bg-accent-tint px-5 py-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stat("Gross P&L", trade.grossPnl, trade.grossPnl != null ? "$" : "")}
          {stat("Net P&L", trade.netPnl, trade.netPnl != null ? "$" : "")}
          {stat("Realized R", trade.realizedR, trade.realizedR != null ? "R" : "")}
          {stat("Planned R:R", trade.plannedRR)}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-x-6 gap-y-5 rounded-lg border border-hairline bg-surface px-5 py-5 sm:grid-cols-4">
        {stat("Entry price", trade.entryPrice)}
        {stat("Exit price", trade.exitPrice)}
        {stat("Quantity", trade.quantity)}
        {stat("Exit", trade.exitAt ? formatDateTime(trade.exitAt) : "Open")}
        {stat("Stop loss", trade.stopLoss)}
        {stat("Target", trade.target)}
        {stat("Risk amount", trade.riskAmount, trade.riskAmount != null ? "$" : "")}
        {stat("Fees", trade.fees, trade.fees != null ? "$" : "")}
        {stat("Exit reason", trade.exitReason)}
        {stat("Setup grade", trade.setupGrade)}
      </div>

      {trade.tags.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-medium text-ink">Tags</h2>
          <div className="flex flex-wrap gap-1.5">
            {trade.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full border border-hairline px-2.5 py-1 text-xs text-muted"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {(trade.confidenceRating != null || trade.followedPlan != null || trade.reflection) && (
        <div className="mb-8 rounded-lg border border-hairline bg-surface px-5 py-5">
          <h2 className="mb-4 text-sm font-medium text-ink">Psychology</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stat("Confidence", trade.confidenceRating, trade.confidenceRating != null ? "/10" : "")}
            {stat(
              "Followed plan",
              trade.followedPlan === null ? undefined : trade.followedPlan ? "Yes" : "No"
            )}
          </div>
          {trade.reflection && (
            <p className="mt-4 max-w-2xl whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
              {trade.reflection}
            </p>
          )}
        </div>
      )}

      <h2 className="mb-3 text-sm font-medium text-ink">Screenshots</h2>
      <ImageUpload tradeId={trade.id} images={trade.images} />
    </div>
  );
}
