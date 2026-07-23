import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";

const sampleTrades = [
  {
    symbol: "EURUSD",
    direction: "Long",
    r: "+2.4R",
    tags: ["Order block", "RSI divergence"],
    date: "Jul 18",
  },
  {
    symbol: "NQ",
    direction: "Short",
    r: "+1.1R",
    tags: ["Liquidity sweep", "CHoCH"],
    date: "Jul 17",
  },
  {
    symbol: "BTCUSD",
    direction: "Long",
    r: "-1.0R",
    tags: ["Bull flag", "VWAP"],
    date: "Jul 16",
  },
];

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/journal");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10 sm:py-16">
      <header className="mb-14 flex items-center justify-between">
        <span className="font-display text-2xl tracking-tight text-ink">
          TradeJournal
        </span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-muted hover:text-ink">
            Sign in
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1">
        <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
          Every setup, every mistake,
          <br />
          one honest record.
        </h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
          Screenshots, chart patterns, SMC tagging, and the psychology behind
          every trade — logged in under two minutes.
        </p>
        <Link
          href="/signup"
          className="mt-6 inline-flex items-center rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-canvas hover:opacity-90"
        >
          Get started
        </Link>

        <section className="mt-12 space-y-3" aria-label="Recent trades preview">
          {sampleTrades.map((t) => (
            <div
              key={t.symbol + t.date}
              className="rounded-lg border border-hairline bg-surface px-5 py-4"
            >
              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-2 text-[15px] font-medium text-ink">
                  {t.symbol}
                  <span className="rounded-full bg-accent-tint px-2 py-0.5 text-xs font-normal text-accent">
                    {t.direction}
                  </span>
                </div>
                <div className="text-lg font-medium text-accent">{t.r}</div>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {t.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-hairline px-2.5 py-0.5 text-xs text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-2 text-xs text-muted">{t.date}, 2026</div>
            </div>
          ))}
        </section>
      </main>

      <footer className="mt-16 text-xs text-muted">
        Phase 2 — trade logging live.
      </footer>
    </div>
  );
}
