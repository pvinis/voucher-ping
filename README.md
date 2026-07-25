# Voucher Ping

A system that periodically scrapes voucher websites for new vouchers and sends email notifications to subscribers.

## Features

- **Automated Web Scraping**: Periodically checks voucher websites for new content
- **Email Notifications**: Sends email alerts to subscribers when new vouchers are found
- **Simple User Interface**: Easy subscription page for users
- **Persistent Storage**: Keeps track of discovered vouchers

## Project Structure

This is a monorepo with the following packages:

- `packages/db`: Database layer using Prisma ORM with SQLite for storing vouchers
- `packages/scraper`: Playwright-based scraper that checks websites for new vouchers
- `packages/api`: Hono server exposing the subscribe endpoint
- `packages/web`: React frontend for user subscription

Subscriber emails are **not** stored in this repository's database. They live in a
Resend audience, which also owns unsubscribe handling.

## Getting Started

### Installation

```bash
bun install
bun run db:generate
```

`bun install` does not run Prisma's postinstall hook, so `bun run db:generate`
is required before anything that imports `@voucher-ping/db`.

### Database Setup

```bash
bun db:migrate
```

### Environment Variables

| Variable             | Used by      | Purpose                                                               |
| -------------------- | ------------ | --------------------------------------------------------------------- |
| `RESEND_API_KEY`     | scraper, api | Resend API key. Without it the scraper only logs a mock notification. |
| `RESEND_AUDIENCE_ID` | scraper, api | Resend audience to subscribe contacts to and broadcast to.            |
| `RESEND_FROM_EMAIL`  | scraper      | Verified sender address, e.g. `Voucher Ping <hi@example.com>`.        |
| `SITE_URL`           | scraper      | Public site URL linked from the notification email.                   |
| `ALLOWED_ORIGINS`    | api          | Comma-separated CORS allowlist. Defaults to `http://localhost:3000`.  |
| `PORT`               | api          | API port. Defaults to `3001`.                                         |
| `VITE_API_URL`       | web (build)  | Base URL of the deployed API. Defaults to `http://localhost:3001`.    |

Copy `.env.example` to `.env` for local development.

### Running the Application

#### Start the Web UI

```bash
bun run dev
```

#### Start the subscribe API

```bash
bun run api
```

#### Run the Scraper Manually

```bash
bun run scrape
```

### Checks

```bash
bun run typecheck     # tsc --noEmit across all packages
bun run format:check  # prettier
bun run build         # web production build
```

These run on every pull request via `.github/workflows/ci.yml`.

### Automated Scraping

The repository includes a GitHub Actions workflow that runs the scraper daily at 8 AM UTC. The workflow is defined in `.github/workflows/daily-scrape.yml`.

To enable email notifications in GitHub Actions:

1. Add `RESEND_API_KEY` and `RESEND_AUDIENCE_ID` as GitHub **secrets**
2. Add `RESEND_FROM_EMAIL` and `SITE_URL` as GitHub **variables**
3. Ensure the workflow has permission to push changes to the repository

The scraper exits non-zero if any source fails, so a broken site shows up as a
red run rather than a quiet "no new vouchers".

## Configuration

### Scraper

The scraper is configured to check the following URLs: [packages/scraper/src/scraper.ts](packages/scraper/src/scraper.ts)

To modify the list of URLs to scrape, edit the `URLS_TO_SCRAPE` object in `packages/scraper/src/scraper.ts`.

### Email Notifications

Email notifications are handled by Resend, sent as a single broadcast to the
audience. To customize the email template:

1. Edit the `generateEmailTemplate` function in `packages/scraper/src/notify.ts`

### Web UI

The web UI is a simple React application that allows users to subscribe to email notifications. To customize the UI:

1. Edit the components in `packages/web/src/components/`
2. Modify the styles in `packages/web/src/index.css`

## Database

The project uses Prisma ORM with SQLite for data persistence. The database file is located at `packages/db/data/db.sqlite` and is committed to the repository — the
web frontend reads it directly over HTTPS rather than talking to a server.

### Database Commands

```bash
# Generate the Prisma client
bun run db:generate

# Run migrations and generate Prisma client
bun db:migrate

# Open Prisma Studio for database inspection
bun --cwd packages/db prisma studio

# Create a new migration
bun --cwd packages/db prisma migrate dev
```
