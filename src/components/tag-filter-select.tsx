"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import type { TagGroup } from "@/lib/actions/tags";

export function TagFilterSelect({
  tagGroups,
  currentTagId,
}: {
  tagGroups: TagGroup[];
  currentTagId?: string;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);

  const currentTag = currentTagId
    ? tagGroups.flatMap((g) => g.tags).find((t) => t.id === currentTagId)
    : undefined;

  return (
    <div className="rounded-lg border border-hairline bg-surface">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left cursor-pointer"
      >
        <span className="truncate text-sm font-medium text-ink">
          {currentTag ? currentTag.name : "Filter by tag"}
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-hairline px-4 py-3">
          <select
            value={currentTagId ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              router.push(value ? `/journal?tag=${value}` : "/journal");
            }}
            className="w-full rounded-md border border-hairline bg-surface px-3 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
          >
            <option value="">All tags</option>
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
          {currentTag && (
            <button
              type="button"
              onClick={() => router.push("/journal")}
              className="mt-2 inline-flex items-center gap-1 text-xs text-muted hover:text-ink cursor-pointer"
            >
              <X size={12} /> Clear filter
            </button>
          )}
        </div>
      )}
    </div>
  );
}

