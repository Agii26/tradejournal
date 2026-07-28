import Link from "next/link";
import { ImageOff } from "lucide-react";
import type { PlainTradeListItem } from "@/lib/actions/trades";

const MAX_VISIBLE_TAGS = 3;

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getOutcome(trade: PlainTradeListItem): { label: string; tone: "win" | "loss" | "neutral" } {
  if (trade.realizedR !== null && trade.realizedR !== undefined) {
    return {
      label: `${trade.realizedR > 0 ? "+" : ""}${trade.realizedR}R`,
      tone: trade.realizedR >= 0 ? "win" : "loss",
    };
  }
  if (trade.exitAt) return { label: "—", tone: "neutral" };
  return { label: "Open", tone: "neutral" };
}

export function TradeCard({ trade }: { trade: PlainTradeListItem }) {
  const outcome = getOutcome(trade);
  const image = trade.images[0]?.url;
  const visibleTags = trade.tags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenTagCount = trade.tags.length - visibleTags.length;

  return (
    <Link
      href={`/journal/${trade.id}`}
      className="block overflow-hidden rounded-lg border border-hairline bg-surface transition-colors hover:border-accent"
    >
      <div className="relative aspect-[16/10] bg-canvas">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- matches image-upload.tsx convention; no next/image remotePatterns configured for R2
          <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <ImageOff size={22} />
          </div>
        )}
        <span
          className={`absolute right-2 top-2 rounded-full px-2.5 py-1 text-xs font-medium ${
            outcome.tone === "win"
              ? "bg-accent text-canvas"
              : outcome.tone === "loss"
                ? "bg-error text-canvas"
                : "bg-ink/70 text-canvas"
          }`}
        >
          {outcome.label}
        </span>
      </div>

      <div className="px-3.5 py-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="text-sm font-medium text-ink">{trade.symbol}</span>
          <span className="rounded-full bg-accent-tint px-2 py-0.5 text-xs font-normal text-accent">
            {trade.direction === "LONG" ? "Long" : "Short"}
          </span>
        </div>
        <div className="mb-2 text-xs text-muted">
          {trade.tradingAccount.name} · {formatDate(trade.entryAt)} · {trade.assetClass}
        </div>
        {trade.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visibleTags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full border border-hairline px-2 py-0.5 text-[11px] text-muted"
              >
                {tag.name}
              </span>
            ))}
            {hiddenTagCount > 0 && (
              <span className="rounded-full border border-hairline px-2 py-0.5 text-[11px] text-muted">
                +{hiddenTagCount}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
