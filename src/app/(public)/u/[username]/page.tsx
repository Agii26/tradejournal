import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { getPublicProfile } from "@/lib/actions/profile";
import { TradeCard } from "@/components/trade-card";
import { FollowButton } from "@/components/follow-button";

function fmtPercent(n: number | null) {
  return n === null ? "—" : `${n}%`;
}

function fmtRatio(n: number | null) {
  if (n === null) return "—";
  return n === Infinity ? "∞" : n.toFixed(2);
}

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
      <div className="mb-8 overflow-visible rounded-lg border border-hairline bg-surface">
        <div className="relative">
          <div className="h-36 w-full overflow-hidden rounded-t-lg bg-canvas">
            {profile.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element -- external R2 URL, matches image-upload.tsx convention
              <img src={profile.coverImage} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="absolute left-5 top-[104px] flex h-[84px] w-[84px] items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-canvas">
            {profile.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- external R2 URL, matches image-upload.tsx convention
              <img src={profile.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <User size={28} className="text-muted" />
            )}
          </div>
        </div>

        <div className="px-5 pb-5 pt-14">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-display text-2xl text-ink">
                {profile.name || `@${profile.username}`}
              </div>
              <div className="text-sm text-muted">@{profile.username}</div>
            </div>
            {profile.isOwnProfile ? (
              <Link
                href="/journal/settings"
                className="whitespace-nowrap rounded-full border border-hairline px-4 py-1.5 text-sm text-ink hover:bg-accent-tint"
              >
                Edit profile
              </Link>
            ) : (
              <FollowButton
                username={profile.username}
                initialFollowing={profile.viewerFollows}
                isLoggedIn={profile.viewerIsLoggedIn}
              />
            )}
          </div>

          {profile.bio && (
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ink">{profile.bio}</p>
          )}

          <div className="mt-3 flex gap-4 text-sm">
            <Link href={`/u/${profile.username}/following`} className="hover:underline">
              <span className="font-medium text-ink">{profile.followingCount}</span>{" "}
              <span className="text-muted">Following</span>
            </Link>
            <Link href={`/u/${profile.username}/followers`} className="hover:underline">
              <span className="font-medium text-ink">{profile.followerCount}</span>{" "}
              <span className="text-muted">Followers</span>
            </Link>
          </div>

          <div className="mt-5 flex gap-8 border-t border-hairline pt-4">
            <div>
              <div className="tabular-nums text-lg font-medium text-ink">
                {fmtPercent(profile.stats.winRate)}
              </div>
              <div className="text-xs text-muted">Win rate</div>
            </div>
            <div>
              <div className="tabular-nums text-lg font-medium text-ink">
                {profile.stats.publicTradeCount}
              </div>
              <div className="text-xs text-muted">Public trades</div>
            </div>
            <div>
              <div className="tabular-nums text-lg font-medium text-accent">
                {fmtRatio(profile.stats.profitFactor)}
              </div>
              <div className="text-xs text-muted">Profit factor</div>
            </div>
          </div>
        </div>
      </div>

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
