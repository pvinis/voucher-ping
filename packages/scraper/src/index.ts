#!/usr/bin/env bun

import { scrape } from "./scraper"
import { mockNotifySubscribers, notifySubscribers } from "./notify"
import { mkdir } from "fs/promises"
import { dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
	console.log("=== Voucher Ping Scraper ===")
	try {
		console.log(`Starting scrape at ${new Date().toISOString()}`)

		await mkdir(dirname(__dirname) + "/../db/data", { recursive: true })
		const allNewVouchers = await scrape()

		if (allNewVouchers.length > 0) {
			console.log(`Ffffound ${allNewVouchers.length} new vouchers`)
			if (process.env.RESEND_API_KEY) {
				// await notifySubscribers(allNewVouchers)
			} else {
				// mockNotifySubscribers(allNewVouchers)
			}
		} else {
			console.log("No new vouchers found, skipping notifications")
		}

		console.log("\nScraper finished successfully")
	} catch (error) {
		console.error("Error running scraper:", error)
		process.exit(1)
	}
}

main().catch((error) => {
	console.error("Unhandled error:", error)
	process.exit(1)
})
