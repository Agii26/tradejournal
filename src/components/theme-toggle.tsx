"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

// Tiny external store over the `dark` class on <html>. useSyncExternalStore's
// getServerSnapshot keeps hydration consistent (server always says "false"),
// then React re-syncs to the real getSnapshot() value right after hydration
// completes — a normal update, not a hydration-mismatch error. The pre-
// hydration script in layout.tsx may have already flipped the class by then,
// so this corrects the icon without ever mismatching what the server sent.
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

function setDark(next: boolean) {
  document.documentElement.classList.toggle("dark", next);
  listeners.forEach((notify) => notify());
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <button
      onClick={() => setDark(!isDark)}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink transition-colors hover:bg-accent-tint cursor-pointer"
    >
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
