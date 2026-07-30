import Link from "next/link";
import { Plus, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { getTrades } from "@/lib/actions/trades";
import { getTagGroups } from "@/lib/actions/tags";
import { getTodayDayPlan } from "@/lib/actions/day-plans";
import { TagFilterSelect } from "@/components/tag-filter-select";
import { DayPlanWidget } from "@/components/day-plan-widget";
import { TradeCard } from "@/components/trade-card";

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; page?: string }>;
}) {
  const { tag, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const [{ trades, totalPages, totalCount }, tagGroups, todayPlan] = await Promise.all([
    getTrades(tag, page),
    getTagGroups(),
    getTodayDayPlan(),
  ]);

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (tag) params.set("tag", tag);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/journal?${qs}` : "/journal";
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr_260px]">
      <aside className="min-w-0">
        <TagFilterSelect tagGroups={tagGroups} currentTagId={tag} />
      </aside>

      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl text-ink">Trades</h1>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/api/export/trades"
              className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-3 py-2 text-sm text-ink hover:bg-accent-tint"
            >
              <Download size={14} /> Export CSV
            </a>
            <Link
              href="/journal/new"
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-canvas hover:opacity-90"
            >
              <Plus size={15} /> Log trade
            </Link>
          </div>
        </div>

        {totalCount === 0 ? (
          <div className="rounded-lg border border-dashed border-hairline px-6 py-16 text-center">
            <p className="text-ink">{tag ? "No trades with that tag." : "No trades logged yet."}</p>
            <p className="mt-1 text-sm text-muted">
              {tag
                ? "Try a different tag, or clear the filter."
                : "Every setup, every mistake — start with your next one."}
            </p>
            {!tag && (
              <Link
                href="/journal/new"
                className="mt-4 inline-block text-sm text-accent hover:underline"
              >
                Log your first trade →
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {trades.map((t) => (
                <TradeCard key={t.id} trade={t} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between text-sm">
                <Link
                  href={pageHref(page - 1)}
                  aria-disabled={page <= 1}
                  className={`inline-flex items-center gap-1 rounded-md border border-hairline px-3 py-1.5 ${
                    page <= 1 ? "pointer-events-none opacity-40" : "text-ink hover:bg-accent-tint"
                  }`}
                >
                  <ChevronLeft size={14} /> Newer
                </Link>
                <span className="text-muted">
                  Page {page} of {totalPages}
                </span>
                <Link
                  href={pageHref(page + 1)}
                  aria-disabled={page >= totalPages}
                  className={`inline-flex items-center gap-1 rounded-md border border-hairline px-3 py-1.5 ${
                    page >= totalPages ? "pointer-events-none opacity-40" : "text-ink hover:bg-accent-tint"
                  }`}
                >
                  Older <ChevronRight size={14} />
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      <aside className="min-w-0">
        <DayPlanWidget initialPlan={todayPlan} />
      </aside>
    </div>
  );
}
