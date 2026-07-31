import Link from "next/link";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-6 pt-4">
        <div className="pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-2xl border border-hairline bg-surface px-5 py-3 shadow-[0_8px_24px_rgba(23,24,26,0.06)]">
          <Link href={session ? "/journal" : "/"} className="font-display text-xl text-ink">
            TradeJournal
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/discover" className="text-sm text-muted hover:text-ink">
              Discover
            </Link>
            <Link
              href={session ? "/journal" : "/login"}
              className="text-sm text-muted hover:text-ink"
            >
              {session ? "My journal" : "Sign in"}
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-10 pt-24 sm:pb-16 sm:pt-28">
        <main className="flex-1">{children}</main>
      </div>
    </>
  );
}
