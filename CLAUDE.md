# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Voucher Ping is a monorepo system that scrapes voucher websites for new vouchers and sends email notifications to subscribers. The system consists of three main packages:

- `@voucher-ping/db`: JSON-based database using LowDB for storing vouchers and metadata
- `@voucher-ping/scraper`: Web scraper using Playwright to extract voucher data from gov.gr
- `@voucher-ping/web`: React frontend for displaying vouchers and handling subscriptions

## Development Commands

### Root Level Commands
- `bun dev` - Start the web development server
- `bun build` - Build the web application for production
- `bun scrape` - Run the voucher scraper
- `bun format` - Format code with Prettier

### Package-Specific Commands
- Web: `bun run --cwd packages/web dev|build|preview`
- Scraper: `bun run --cwd packages/scraper build|start`
- DB: `bun run --cwd packages/db build|start`

## Architecture

The system follows a simple data flow:

1. **Scraper** (`packages/scraper/src/index.ts`) orchestrates the process:
   - Scrapes vouchers from configured URLs (currently vouchers.gov.gr)
   - Compares with existing vouchers in the database
   - Sends email notifications for new vouchers via Resend API

2. **Database** (`packages/db/src/index.ts`) provides:
   - JSON file storage in `packages/db/data/db.json`
   - Voucher schema with id, title, url, imageUrl, discoveredAt
   - Functions: `addVoucher()`, `getVouchers()`, `updateLastChecked()`

3. **Web Frontend** (`packages/web/src/App.tsx`) displays:
   - Subscription form for email notifications
   - Latest vouchers list
   - React with Tailwind CSS styling

## Key Configuration

- **Scraper URLs**: Edit `URLS_TO_SCRAPE` array in `packages/scraper/src/index.ts`
- **Email Notifications**: Requires `RESEND_API_KEY` environment variable
- **Database**: Auto-creates `packages/db/data/db.json` on first run
- **Automation**: GitHub Actions workflow runs daily at 8 AM UTC

## Environment Variables

- `RESEND_API_KEY`: Required for email notifications (falls back to mock logging)

## Package Manager

This project uses Bun as the package manager and runtime. All scripts can be run with `bun` instead of `bun run`.