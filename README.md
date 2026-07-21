# TradeJournal

Personal discretionary-trading journal — screenshots, chart-pattern/SMC tagging, psychology tracking, analytics. Full spec and phased roadmap: `Projects/TradeJournal/Roadmap.md` in the Obsidian vault.

## Stack

Next.js 16 (App Router, TypeScript) · PostgreSQL via Neon · Prisma 7 (driver-adapter architecture, `@prisma/adapter-neon`) · Auth.js v5 (Credentials + JWT sessions) · Tailwind CSS v4 · Cloudflare R2 for images (not wired yet — Phase 2) · Recharts (Phase 5).

## Design system

**Ink & Alabaster** — locked, WCAG AA verified. Tokens live in `src/app/globals.css` as CSS variables (`--color-canvas`, `--color-surface`, `--color-ink`, `--color-muted`, `--color-accent`, `--color-accent-tint`, `--color-hairline`), swapped by a `.dark` class toggle rather than `prefers-color-scheme` alone. Fonts: Instrument Serif (headings) + Manrope (body/data, tabular figures) via `next/font/google` in `src/app/layout.tsx`.

## Status — Phase 1 (Foundation)

Done:
- Project scaffolded, design tokens locked and rendered (see `src/app/page.tsx` for a live preview of the palette + a sample trade card)
- Prisma schema written (`prisma/schema.prisma`): Auth.js models (User/Account/Session/VerificationToken) + domain models (TradingAccount, Trade, TradeImage, Tag, TradeTag, DayPlan) with a JSONB `extra` field for per-asset-class data and indexes on `(userId, entryAt)` / `(userId, symbol)`
- Auth.js v5 wired: `src/auth.config.ts` (edge-safe, used by `src/proxy.ts`) + `src/auth.ts` (full config with Prisma adapter + bcrypt-checked Credentials provider, Node runtime only) + `src/app/api/auth/[...nextauth]/route.ts`
- Lint and TypeScript both clean **except** the one item below

Blocked — needs three things from you before Phase 1 can fully close:

1. **Neon connection strings.** Create a Neon project, then set in `.env` (copy `.env.example`):
   - `DATABASE_URL` — the **pooled** connection string (used by the running app via `@prisma/adapter-neon`)
   - `DIRECT_URL` — the **direct** connection string (used by the Prisma CLI for migrations, configured in `prisma.config.ts`)
2. **Run `npx prisma generate` then `npx prisma migrate dev`.** This sandbox's network is domain-allowlisted and can't reach `binaries.prisma.sh`, so the Prisma client couldn't be generated or type-checked here — that's the one TypeScript error you'll see if you check right now (`Cannot find module '@/generated/prisma/client'`). It'll resolve the moment `generate` runs somewhere with normal internet access. Same story for the two fonts (`fonts.googleapis.com` was also blocked in-sandbox) — `next build` will fetch them fine on your machine or on Vercel.
3. **Cloudflare R2 bucket + API keys** (for Phase 2's image upload) and a **GitHub repo + PAT** so this can be pushed to `Agii26/tradejournal`.

Run `openssl rand -base64 32` (or `npx auth secret`) for `AUTH_SECRET` in `.env` — the placeholder in `.env.example` is not usable as-is.

## Commands

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```
