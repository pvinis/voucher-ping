#!/usr/bin/env bun
import { scrapeVouchers, processScrapedVouchers } from "./scraper.js";
import { notifySubscribers, mockNotifySubscribers } from "./notify.js";
import { mkdir } from "fs/promises";
import { dirname } from "path";
import { fileURLToPath } from "url";

// URLs to scrape
const URLS_TO_SCRAPE = [
	"https://vouchers.gov.gr",
	// Add additional URLs here when needed
];

// Get the directory path for the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Main function to run the scraper
 */
async function main() {
	console.log("=== Voucher Ping Scraper ===");
	console.log(`Starting scrape at ${new Date().toISOString()}`);

	try {
		// Create data directory if it doesn't exist
		await mkdir(dirname(__dirname) + "/../db/data", { recursive: true });

		// Process each URL
		for (const url of URLS_TO_SCRAPE) {
			console.log(`\nProcessing URL: ${url}`);

			// Scrape vouchers from the website
			const scrapedVouchers = await scrapeVouchers(url);
			console.log(
				`Found ${scrapedVouchers.length} total vouchers on the site`,
			);

			// Process scraped vouchers (compare with existing ones)
			const newVouchers = await processScrapedVouchers(scrapedVouchers);
			console.log(`Found ${newVouchers.length} new vouchers`);

			// If there are new vouchers, notify subscribers
			if (newVouchers.length > 0) {
				// Check if we have a Resend API key
				if (process.env.RESEND_API_KEY) {
					await notifySubscribers(newVouchers);
				} else {
					// If no API key, just log what would have been sent
					mockNotifySubscribers(newVouchers);
				}
			} else {
				console.log("No new vouchers found, skipping notifications");
			}
		}

		console.log("\nScraper finished successfully");
	} catch (error) {
		console.error("Error running scraper:", error);
		process.exit(1);
	}
}

// Run the main function
main().catch((error) => {
	console.error("Unhandled error:", error);
	process.exit(1);
});
