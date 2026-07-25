import Link from "next/link";
import { auth, signOut } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function JournalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-8">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/journal" className="font-display text-2xl text-ink">
            TradeJournal
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/journal" className="text-muted hover:text-ink">
              Journal
            </Link>
            <Link href="/journal/analytics" className="text-muted hover:text-ink">
              Analytics
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-muted sm:inline">{session?.user?.email}</span>
          <ThemeToggle />
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="text-sm text-muted hover:text-ink cursor-pointer">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
