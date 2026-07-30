"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
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
  const currentCategory = currentTagId
    ? tagGroups.find((g) => g.tags.some((t) => t.id === currentTagId))?.category
    : undefined;

  const [openCategory, setOpenCategory] = useState<string | null>(currentCategory ?? null);

  function select(tagId: string | null) {
    router.push(tagId ? `/journal?tag=${tagId}` : "/journal");
  }

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
          <label className="flex cursor-pointer items-center gap-2 border-b border-hairline pb-2.5 text-sm text-ink">
            <input
              type="radio"
              name="tag-filter"
              checked={!currentTagId}
              onChange={() => select(null)}
              className="accent-accent"
            />
            All tags
          </label>

          {tagGroups.map((group) => {
            if (group.tags.length === 0) return null;
            const isOpen = openCategory === group.category;
            return (
              <div key={group.category} className="border-b border-hairline last:border-b-0">
                <button
                  type="button"
                  onClick={() => setOpenCategory(isOpen ? null : group.category)}
                  className="flex w-full items-center justify-between py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted cursor-pointer"
                >
                  {group.label}
                  <ChevronDown
                    size={12}
                    className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="pb-2">
                    {group.tags.map((tag) => (
                      <label
                        key={tag.id}
                        className="flex cursor-pointer items-start gap-2 py-1 text-sm text-ink"
                      >
                        <input
                          type="radio"
                          name="tag-filter"
                          checked={currentTagId === tag.id}
                          onChange={() => select(tag.id)}
                          className="mt-0.5 shrink-0 accent-accent"
                        />
                        <span className="break-words">{tag.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
