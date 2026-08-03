import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { getFollowList } from "@/lib/actions/profile";
import { FollowButton } from "@/components/follow-button";

export async function FollowListView({
  username,
  kind,
  page,
}: {
  username: string;
  kind: "followers" | "following";
  page: number;
}) {
  const list = await getFollowList(username, kind, page);
  if (!list) notFound();

  const pageHref = (p: number) => `/u/${list.profileUsername}/${kind}${p > 1 ? `?page=${p}` : ""}`;
  const label = kind === "followers" ? "Followers" : "Following";

  return (
    <div className="max-w-xl">
      <Link
        href={`/u/${list.profileUsername}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ChevronLeft size={14} /> @{list.profileUsername}
      </Link>
      <h1 className="mb-6 font-display text-2xl text-ink">
        {label} <span className="text-muted">({list.totalCount})</span>
      </h1>

      {list.entries.length === 0 ? (
        <p className="text-sm text-muted">
          {kind === "followers" ? "No followers yet." : "Not following anyone yet."}
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {list.entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-surface px-4 py-3"
              >
                <Link href={`/u/${entry.username}`} className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-canvas">
                    {entry.image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- external R2 URL, matches image-upload.tsx convention
                      <img src={entry.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User size={16} className="text-muted" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">
                      {entry.name || `@${entry.username}`}
                    </span>
                    <span className="block truncate text-xs text-muted">@{entry.username}</span>
                  </span>
                </Link>
                {!entry.isViewer && (
                  <FollowButton
                    username={entry.username}
                    initialFollowing={entry.viewerFollows}
                    isLoggedIn={list.viewerIsLoggedIn}
                  />
                )}
              </div>
            ))}
          </div>

          {list.totalPages > 1 && (
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
                Page {page} of {list.totalPages}
              </span>
              <Link
                href={pageHref(page + 1)}
                aria-disabled={page >= list.totalPages}
                className={`inline-flex items-center gap-1 rounded-md border border-hairline px-3 py-1.5 ${
                  page >= list.totalPages ? "pointer-events-none opacity-40" : "text-ink hover:bg-accent-tint"
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
