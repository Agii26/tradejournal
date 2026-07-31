"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBox({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const trimmed = value.trim();
      router.push(trimmed ? `/discover?q=${encodeURIComponent(trimmed)}` : "/discover");
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run the debounce on value changes, not on router identity
  }, [value]);

  return (
    <div className="relative">
      <Search
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search username…"
        autoFocus
        className="w-full rounded-md border border-hairline bg-surface py-2 pl-9 pr-3 text-sm text-ink focus:border-accent focus:outline-none"
      />
    </div>
  );
}
