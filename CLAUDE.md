# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Voucher Ping is a monorepo system that scrapes Greek government voucher websites for new vouchers and sends email notifications to subscribers. The system consists of four packages:

- `@voucher-ping/db`: Database layer using Prisma with SQLite for storing vouchers and metadata
- `@voucher-ping/scraper`: Web scraper using Playwright to extract voucher data from gov.gr domains
- `@voucher-ping/api`: Hono server exposing the subscribe endpoint
- `@voucher-ping/web`: React frontend for displaying vouchers and handling subscriptions

Subscriber emails are **not** stored in this database. They live in a Resend
audience, which also owns unsubscribe handling. The `Subscriber` model was
dropped in the `remove_emails` migration.

## Development Commands

### Root Level Commands

- `bun dev` - Start the web development server
- `bun api` - Start the subscribe API server
- `bun build` - Build the web application and run TypeScript compilation
- `bun scrape` - Run the voucher scraper
- `bun typecheck` - Type check every package
- `bun format` - Format code with Prettier
- `bun format:check` - Check formatting without writing
- `bun run db:generate` - Generate the Prisma client

### Package-Specific Commands

- Web: `bun --cwd packages/web dev|build|preview|typecheck`
- Scraper: `bun --cwd packages/scraper build|start|typecheck`
- API: `bun --cwd packages/api dev|start|typecheck`
- DB: `bun --cwd packages/db build|start|db:migrate|typecheck`

### Database Commands

- `bun --cwd packages/db db:migrate` - Run Prisma migrations and generate client
- `bun --cwd packages/db prisma migrate dev` - Create and apply new migration
- `bun --cwd packages/db prisma studio` - Open Prisma Studio for database inspection
- `cd packages/db && bunx prisma generate` - Generate Prisma client types

### TypeScript Commands

- `bun typecheck` - Type check all packages without emitting files
- `cd packages/<pkg> && bunx tsc --noEmit` - Type check one package

There is deliberately **no root `tsconfig.json`**. Each package needs a
different `lib` (DOM for web/scraper, none for db/api), so a single root config
swept every package in with the wrong settings and reported phantom errors.
`bun typecheck` is the source of truth and runs in CI.

## Architecture

### Database Layer (`@voucher-ping/db`)

- **Technology**: Prisma ORM with SQLite database
- **Location**: `packages/db/data/db.sqlite`
- **Schema**: Defined in `packages/db/prisma/schema.prisma`
- **Models**:
  - `Voucher`: Stores voucher data with sourceId and tags for categorization
  - `Metadata`: Singleton pattern for scraper run timestamps

### Data Flow Architecture

1. **Scraper** (`packages/scraper/src/scraper.ts`) orchestrates the process:
   - Iterates through configured URL sources in `URLS_TO_SCRAPE`
   - Each source has a dedicated scraper, sourceId, and tags
   - Compares with existing vouchers in database to find new ones
   - Adds new vouchers with appropriate sourceId and tags
   - Sends one Resend broadcast to the audience covering all new vouchers
   - Returns `{ newVouchers, failures, emptySources }`; a non-empty `failures`
     exits the process non-zero so a broken source produces a red CI run

2. **Source Classification**:
   - `vouchers.gov.gr` → sourceId: "vouchers-gov", tags: ["personal"]
   - `digitalsme.gov.gr` → sourceId: "digitalsme-gov", tags: ["work"]

3. **Scraper Architecture**:
   - Individual scrapers implement the `Scraper` interface
   - Each scraper handles site-specific DOM extraction logic
   - Shared utilities in `packages/scraper/src/scrapers/shared.ts`

### Web Frontend (`@voucher-ping/web`)

- **Technology**: React with Vite and Tailwind CSS
- **Data Source**: Fetches the committed `db.sqlite` from raw.githubusercontent
  and queries it in-browser with sql.js (no server). The sql.js WASM is bundled
  with the app, not loaded from the sql.js CDN.
- **Features**: Subscription form and voucher display
- **API URL**: `VITE_API_URL` at build time; defaults to `http://localhost:3001`

## Key Configuration

### Scraper Configuration

- **URLs**: Edit `URLS_TO_SCRAPE` object in `packages/scraper/src/scraper.ts`
- **Source Mapping**: Each URL entry includes scraper function, sourceId, and tags
- **Adding New Sources**: Create new scraper in `packages/scraper/src/scrapers/`, add to `URLS_TO_SCRAPE`

### Database Schema Changes

- **Migrations**: Use `bun --cwd packages/db prisma migrate dev --name "description"`
- **Schema**: Edit `packages/db/prisma/schema.prisma`
- **Type Safety**: Prisma generates TypeScript types in `node_modules/@prisma/client`
- **Regenerate Types**: Use `bunx prisma generate` after schema changes

### Email Notifications

- **Provider**: Resend API, sent as a single broadcast per scrape run
- **Configuration**: Requires `RESEND_API_KEY` and `RESEND_AUDIENCE_ID`
- **Fallback**: Mock notifications when API key is missing
- **Unsubscribe**: `{{{RESEND_UNSUBSCRIBE_URL}}}` merge tag, expanded by Resend

## Environment Variables

- `RESEND_API_KEY`: Required for email notifications (falls back to mock logging)
- `RESEND_AUDIENCE_ID`: Resend audience to subscribe to and broadcast to
- `RESEND_FROM_EMAIL`: Verified sender address for broadcasts
- `SITE_URL`: Public site URL linked from the notification email
- `ALLOWED_ORIGINS`: Comma-separated CORS allowlist for the API
- `VITE_API_URL`: Base URL of the deployed API, baked into the web build

## Package Manager

This project uses Bun as the package manager and runtime. All scripts can be run with `bun` instead of `bun run`.

## Important Development Notes

### Database Migrations

- Always test migrations with existing data
- Use `--create-only` flag for complex migrations that require manual SQL editing
- Ensure sourceId and tags are properly set for new vouchers

### Scraper Development

- Each scraper must implement the `Scraper` interface from `shared.ts`
- Test scrapers individually before adding to `URLS_TO_SCRAPE`
- Handle dynamic content loading (lazy loading, infinite scroll)
- Use proper error handling and browser cleanup

### Type Safety

- Database types are auto-generated by Prisma in `node_modules/@prisma/client`
- **Import Prisma types from the db package**: `import type { Voucher } from "@voucher-ping/db"`
- **Never import directly from `@prisma/client`** in web or scraper packages
- `VoucherToBeAdded` type omits auto-generated fields (id, discoveredAt)
- Scrapers return `ScrapedVoucher[]` which gets enhanced with sourceId and tags

## Build Process

### Vercel Build Configuration

The build process automatically:

1. Generates Prisma client types (`prisma generate`)
2. Compiles TypeScript (`tsc`)
3. Builds web application (`vite build`)

### Build Dependencies

- Web depends on `@voucher-ping/db` for types only; `prisma` resolves from the
  db package via workspace hoisting
- Web package uses `prebuild` script: `cd ../db && bunx prisma generate`
- Build script: `tsc && vite build` (prebuild runs automatically before build)

### Important Build Notes

- Always run `prisma generate` before TypeScript compilation
- Prisma types must be generated in the db package location
- All packages import Prisma types from `@voucher-ping/db`, never directly from `@prisma/client`
- **`bun install` does not run Prisma's postinstall.** Without an explicit
  `bun run db:generate`, `@prisma/client` stays a stub that throws
  `did not initialize yet` on construction. This silently broke every scheduled
  scrape for a year; both workflows now run it as a dedicated step.

## CI

- `.github/workflows/ci.yml` runs format check, typecheck and build on every PR
- `.github/workflows/daily-scrape.yml` runs the scraper daily at 08:00 UTC and
  commits the updated `db.sqlite`
