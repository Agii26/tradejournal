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
      {/* Desktop: logo left, segmented nav pill true-centered, utility pill right — grid keeps the
          center pill centered on the viewport regardless of the side items' differing widths */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 hidden px-6 pt-4 sm:block">
        <div className="mx-auto grid w-full max-w-4xl grid-cols-[1fr_auto_1fr] items-center">
          <Link href="/journal" className="pointer-events-auto justify-self-start font-display text-2xl text-ink">
            TradeJournal
          </Link>

          <nav
            className={`pointer-events-auto flex items-center gap-1 justify-self-center rounded-full border border-hairline bg-surface p-1.5 ${pillShadow}`}
          >
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    active ? "bg-accent-tint font-medium text-accent" : "text-muted hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div
            title={userEmail ?? undefined}
            className={`pointer-events-auto flex items-center justify-self-end gap-3 rounded-full border border-hairline bg-surface px-4 py-2 ${pillShadow}`}
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

