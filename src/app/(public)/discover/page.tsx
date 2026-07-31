import Link from "next/link";
import { searchPublicUsers } from "@/lib/actions/profile";
import { SearchBox } from "@/components/search-box";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query.length > 0 ? await searchPublicUsers(query) : [];

  return (
    <div className="max-w-xl">
      <h1 className="mb-2 font-display text-3xl text-ink">Discover</h1>
      <p className="mb-6 text-sm text-muted">Search for a trader&rsquo;s public profile.</p>

      <SearchBox initialQuery={query} />

      {query.length > 0 && (
        <div className="mt-6">
          {results.length === 0 ? (
            <p className="text-sm text-muted">No public profiles match &ldquo;{query}&rdquo;.</p>
          ) : (
            <div className="space-y-2">
              {results.map((u) => (
                <Link
                  key={u.username}
                  href={`/u/${u.username}`}
                  className="block rounded-lg border border-hairline bg-surface px-4 py-3 text-sm font-medium text-ink hover:border-accent"
                >
                  @{u.username}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
