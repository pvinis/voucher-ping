#!/usr/bin/env bun

import { scrape } from "./scraper"
import { mockNotifySubscribers, notifySubscribers } from "./notify"
import { mkdir } from "fs/promises"
import { dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
	console.log("=== Voucher Ping Scraper ===")
	console.log(`Starting scrape at ${new Date().toISOString()}`)

	await mkdir(dirname(__dirname) + "/../db/data", { recursive: true })
	const { newVouchers, failures, emptySources } = await scrape()

	if (newVouchers.length > 0) {
		console.log(`Found ${newVouchers.length} new vouchers`)
		if (process.env.RESEND_API_KEY) {
			await notifySubscribers(newVouchers)
		} else {
			mockNotifySubscribers(newVouchers)
		}
	} else {
		console.log("No new vouchers found, skipping notifications")
	}

	if (emptySources.length > 0) {
		console.warn(`\nSources that returned nothing: ${emptySources.join(", ")}`)
	}

	// Vouchers found before the failure are already saved and notified, but the
	// run still has to go red so a broken source gets noticed.
	if (failures.length > 0) {
		console.error(`\n${failures.length} source(s) failed:`)
		for (const { url } of failures) {
			console.error(`  - ${url}`)
		}
		process.exit(1)
	}

	console.log("\nScraper finished successfully")
}

main().catch((error) => {
	console.error("Error running scraper:", error)
	process.exit(1)
})
