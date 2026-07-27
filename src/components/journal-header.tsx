"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/journal", label: "Journal" },
  { href: "/journal/analytics", label: "Analytics" },
  { href: "/journal/accounts", label: "Accounts" },
  { href: "/journal/import", label: "Import" },
];

export function JournalHeader({
  userEmail,
  rightSlot,
}: {
  userEmail?: string | null;
  rightSlot: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="mb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/journal"
            onClick={() => setOpen(false)}
            className="font-display text-2xl text-ink"
          >
            TradeJournal
          </Link>
          <nav className="hidden items-center gap-4 text-sm sm:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-muted hover:text-ink">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-4 sm:flex">
          {userEmail && <span className="text-sm text-muted">{userEmail}</span>}
          {rightSlot}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md text-ink cursor-pointer sm:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="mt-4 flex flex-col gap-1 border-t border-hairline pt-4 sm:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2.5 text-sm text-muted hover:bg-accent-tint hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex items-center justify-between border-t border-hairline px-3 pt-3">
            {userEmail && <span className="text-xs text-muted">{userEmail}</span>}
            {rightSlot}
          </div>
        </div>
      )}
    </header>
  );
}
