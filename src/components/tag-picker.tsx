"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Plus, Search, X } from "lucide-react";
import { createCustomTag } from "@/lib/actions/tags";
import type { TagGroup, PlainTag } from "@/lib/actions/tags";

export function TagPicker({
  tagGroups,
  defaultSelectedIds = [],
}: {
  tagGroups: TagGroup[];
  defaultSelectedIds?: string[];
}) {
  const [groups, setGroups] = useState(tagGroups);
  const [selected, setSelected] = useState<Map<string, PlainTag>>(() => {
    const map = new Map<string, PlainTag>();
    for (const group of tagGroups) {
      for (const tag of group.tags) {
        if (defaultSelectedIds.includes(tag.id)) map.set(tag.id, tag);
      }
    }
    return map;
  });
  const [query, setQuery] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>(
    tagGroups[0]?.category ?? null
  );
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const toggle = (tag: PlainTag) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(tag.id)) next.delete(tag.id);
      else next.set(tag.id, tag);
      return next;
    });
  };

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return groups;
    const q = query.toLowerCase();
    return groups
      .map((g) => ({ ...g, tags: g.tags.filter((t) => t.name.toLowerCase().includes(q)) }))
      .filter((g) => g.tags.length > 0);
  }, [groups, query]);

  async function handleAddCustom(category: string) {
    const name = newTagName.trim();
    if (!name) return;
    setIsAdding(true);
    setAddError(null);

    try {
      const fd = new FormData();
      fd.set("name", name);
      fd.set("category", category);
      const result = await createCustomTag(undefined, fd);

      if (result.error || !result.tag) {
        setAddError(result.error ?? "Couldn't add tag");
        return;
      }

      const tag = result.tag;
      setGroups((prev) =>
        prev.map((g) =>
          g.category === category && !g.tags.some((t) => t.id === tag.id)
            ? { ...g, tags: [...g.tags, tag].sort((a, b) => a.name.localeCompare(b.name)) }
            : g
        )
      );
      setSelected((prev) => new Map(prev).set(tag.id, tag));
      setNewTagName("");
      setAddingTo(null);
    } catch {
      setAddError("Something went wrong adding that tag — try again");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {[...selected.values()].map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggle(tag)}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1.5 text-xs text-canvas hover:opacity-90 cursor-pointer"
            >
              {tag.name}
              <X size={11} />
            </button>
          ))}
          {[...selected.keys()].map((id) => (
            <input key={id} type="hidden" name="tagIds" value={id} />
          ))}
        </div>
      )}

      <div className="relative mb-3">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search patterns, indicators, SMC…"
          className="w-full rounded-md border border-hairline bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="rounded-lg border border-hairline">
        {filteredGroups.map((group, i) => {
          const isOpen = query.trim() ? true : openCategory === group.category;
          return (
            <div key={group.category} className={i > 0 ? "border-t border-hairline" : ""}>
              <button
                type="button"
                onClick={() => setOpenCategory(isOpen ? null : group.category)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-ink cursor-pointer"
              >
                <span>
                  {group.label}{" "}
                  <span className="font-normal text-muted">
                    ({group.tags.filter((t) => selected.has(t.id)).length}/{group.tags.length})
                  </span>
                </span>
                <ChevronDown
                  size={15}
                  className={`text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isOpen && (
                <div className="flex flex-wrap gap-2 px-4 pb-3">
                  {group.tags.map((tag) => {
                    const isSelected = selected.has(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggle(tag)}
                        className={`rounded-full border px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? "border-accent bg-accent-tint text-accent"
                            : "border-hairline text-muted hover:border-accent hover:text-ink"
                        }`}
                      >
                        {tag.name}
                      </button>
                    );
                  })}

                  {addingTo === group.category ? (
                    <div className="flex items-center gap-1">
                      <input
                        autoFocus
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustom(group.category);
                          }
                          if (e.key === "Escape") setAddingTo(null);
                        }}
                        placeholder="New tag name"
                        className="w-32 rounded-full border border-hairline bg-surface px-2.5 py-1 text-xs text-ink focus:border-accent focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={isAdding}
                        onClick={() => handleAddCustom(group.category)}
                        className="text-xs text-accent hover:underline cursor-pointer disabled:opacity-50"
                      >
                        {isAdding ? "…" : "Add"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAddingTo(group.category);
                        setAddError(null);
                      }}
                      className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-hairline px-2.5 py-1.5 text-xs text-muted hover:border-accent hover:text-accent cursor-pointer"
                    >
                      <Plus size={11} /> Custom
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filteredGroups.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-muted">No tags match &ldquo;{query}&rdquo;</p>
        )}
      </div>
      {addError && <p className="mt-1.5 text-xs text-error">{addError}</p>}
    </div>
  );
}
