"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/journal", label: "Journal" },
  { href: "/journal/analytics", label: "Analytics" },
  { href: "/journal/accounts", label: "Accounts" },
  { href: "/journal/import", label: "Import" },
];

const SECTION_ROOTS = ["/journal/analytics", "/journal/accounts", "/journal/import"];

function isActive(pathname: string, href: string) {
  if (href === "/journal") {
    return pathname === "/journal" || (pathname.startsWith("/journal/") && !SECTION_ROOTS.some((p) => pathname.startsWith(p)));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const pillShadow = "shadow-[0_8px_24px_rgba(23,24,26,0.06)]";

export function JournalHeader({
  userEmail,
  rightSlot,
}: {
  userEmail?: string | null;
  rightSlot: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: one continuous floating bar — logo pill and utility pill are visually
          distinct sub-groups, nav links sit plain between them */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 hidden px-6 pt-4 sm:block">
        <div
          className={`pointer-events-auto mx-auto flex w-full max-w-7xl items-center justify-between rounded-2xl border border-hairline bg-surface px-3 py-2.5 ${pillShadow}`}
        >
          <div className="flex items-center gap-7">
            <Link
              href="/journal"
              className="rounded-full border border-hairline px-3 py-1.5 font-display text-lg text-ink"
            >
              TradeJournal
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              {NAV_LINKS.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`transition-colors ${active ? "font-medium text-accent" : "text-muted hover:text-ink"}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div
            title={userEmail ?? undefined}
            className="flex items-center gap-3 rounded-full border border-hairline px-3.5 py-1.5"
          >
            {rightSlot}
          </div>
        </div>
      </header>

      {/* Mobile: one floating bar; hamburger reveals a floating panel that overlays content below it
          rather than pushing content down, since the bar itself no longer sits in normal flow */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex flex-col gap-2 px-4 pt-4 sm:hidden">
        <div
          className={`pointer-events-auto flex items-center justify-between rounded-2xl border border-hairline bg-surface px-4 py-3 ${pillShadow}`}
        >
          <Link href="/journal" onClick={() => setOpen(false)} className="font-display text-xl text-ink">
            TradeJournal
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="-mr-1.5 flex h-11 w-11 items-center justify-center rounded-md text-ink cursor-pointer"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <div className={`pointer-events-auto flex flex-col gap-1 rounded-2xl border border-hairline bg-surface p-2 ${pillShadow}`}>
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm ${
                    active ? "bg-accent-tint font-medium text-accent" : "text-muted hover:bg-accent-tint hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="mt-1 flex items-center justify-between border-t border-hairline px-3 pt-3">
              {userEmail && <span className="text-xs text-muted">{userEmail}</span>}
              {rightSlot}
            </div>
          </div>
        )}
      </header>
    </>
  );
}

