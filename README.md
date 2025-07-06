# Voucher Ping

A system that periodically scrapes voucher websites for new vouchers and sends email notifications to subscribers.

# test new.email for template

## Features

- **Automated Web Scraping**: Periodically checks voucher websites for new content
- **Email Notifications**: Sends email alerts to subscribers when new vouchers are found
- **Simple User Interface**: Easy subscription page for users
- **Persistent Storage**: Keeps track of discovered vouchers and subscribers

## Project Structure

This is a monorepo with the following packages:

- `packages/db`: Database layer using Prisma ORM with SQLite for storing vouchers and subscribers
- `packages/scraper`: Playwright-based scraper that checks websites for new vouchers
- `packages/web`: React frontend for user subscription

## Getting Started

### Installation

```bash
bun install
```

### Database Setup

```bash
bun db:migrate
```

### Environment Variables

```bash
# For email sending (optional during development)
export RESEND_API_KEY=your_resend_api_key
```

### Running the Application

#### Start the Web UI

```bash
bun run dev
```

#### Run the Scraper Manually

```bash
bun run scrape
```

### Automated Scraping

The repository includes a GitHub Actions workflow that runs the scraper daily at 8 AM UTC. The workflow is defined in `.github/workflows/daily-scrape.yml`.

To enable email notifications in GitHub Actions:

1. Add your `RESEND_API_KEY` as a GitHub secret
2. Ensure the workflow has permission to push changes to the repository

## Configuration

### Scraper

The scraper is configured to check the following URLs: [packages/scraper/src/scraper.ts](packages/scraper/src/scraper.ts)

To modify the list of URLs to scrape, edit the `URLS_TO_SCRAPE` object in `packages/scraper/src/scraper.ts`.

### Email Notifications

Email notifications are handled by Resend. To customize the email templates:

1. Edit the `generateEmailTemplate` function in `packages/scraper/src/notify.ts`

### Web UI

The web UI is a simple React application that allows users to subscribe to email notifications. To customize the UI:

1. Edit the components in `packages/web/src/components/`
2. Modify the styles in `packages/web/src/index.css`

## Database

The project uses Prisma ORM with SQLite for data persistence. The database file is located at `packages/db/data/db.sqlite`.

### Database Commands

```bash
# Run migrations and generate Prisma client
bun db:migrate

# Open Prisma Studio for database inspection
bun --cwd packages/db prisma studio

# Create a new migration
bun --cwd packages/db prisma migrate dev
```
