import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPublicProfile } from "@/lib/actions/profile";
import { TradeCard } from "@/components/trade-card";

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { username } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const profile = await getPublicProfile(username, page);
  if (!profile) notFound();

  const pageHref = (p: number) => `/u/${profile.username}${p > 1 ? `?page=${p}` : ""}`;

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl text-ink">@{profile.username}</h1>
      <p className="mb-8 text-sm text-muted">
        {profile.totalCount} public trade{profile.totalCount === 1 ? "" : "s"}
      </p>

      {profile.trades.length === 0 ? (
        <p className="text-sm text-muted">No public trades yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profile.trades.map((t) => (
              <TradeCard key={t.id} trade={t} href={`/u/${profile.username}/${t.id}`} />
            ))}
          </div>

          {profile.totalPages > 1 && (
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
                Page {page} of {profile.totalPages}
              </span>
              <Link
                href={pageHref(page + 1)}
                aria-disabled={page >= profile.totalPages}
                className={`inline-flex items-center gap-1 rounded-md border border-hairline px-3 py-1.5 ${
                  page >= profile.totalPages
                    ? "pointer-events-none opacity-40"
                    : "text-ink hover:bg-accent-tint"
                }`}
              >
                Older <ChevronRight size={14} />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
