"use client";

import { useRouter } from "next/navigation";
import type { TagGroup } from "@/lib/actions/tags";

export function TagFilterSelect({
  tagGroups,
  currentTagId,
}: {
  tagGroups: TagGroup[];
  currentTagId?: string;
}) {
  const router = useRouter();

  return (
    <select
      value={currentTagId ?? ""}
      onChange={(e) => {
        const value = e.target.value;
        router.push(value ? `/journal?tag=${value}` : "/journal");
      }}
      className="rounded-md border border-hairline bg-surface px-3 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
    >
      <option value="">Filter by tag…</option>
      {tagGroups.map((group) =>
        group.tags.length > 0 ? (
          <optgroup key={group.category} label={group.label}>
            {group.tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </optgroup>
        ) : null
      )}
    </select>
  );
}
