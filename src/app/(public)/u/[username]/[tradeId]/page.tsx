import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPublicTrade } from "@/lib/actions/profile";

function formatDateTime(d: string | Date) {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function PublicTradeDetailPage({
  params,
}: {
  params: Promise<{ username: string; tradeId: string }>;
}) {
  const { username, tradeId } = await params;
  const trade = await getPublicTrade(username, tradeId);
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
      <Link
        href={`/u/${trade.ownerUsername}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft size={14} /> @{trade.ownerUsername}
      </Link>

      <div className="mb-8">
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

      {trade.images.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-ink">Screenshots</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {trade.images.map((img) => (
              <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element -- matches image-upload.tsx convention, no next/image remotePatterns configured for R2 */}
                <img
                  src={img.url}
                  alt=""
                  loading="lazy"
                  className="w-full rounded-lg border border-hairline object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
