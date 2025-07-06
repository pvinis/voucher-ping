import type { Voucher } from "@voucher-ping/db"
import { addVoucher, getVouchers, updateLastChecked } from "@voucher-ping/db"
import { scraperVouchersGov } from "./scrapers/vouchers-gov"
// import { scrapeDigitalsmeGov } from "./scrapers/digitalsme-gov"
import type { ScrapedVoucher } from "./scrapers/shared"

const URLS_TO_SCRAPE = {
	"https://vouchers.gov.gr": scraperVouchersGov,
	// "https://digitalsme.gov.gr/νέα-ανακοινώσεις": scrapeDigitalsmeGov,
}

export async function scrape(): Promise<Voucher[]> {
	const allNewVouchers: Voucher[] = []

	for (const [url, scraper] of Object.entries(URLS_TO_SCRAPE)) {
		console.log(`\nProcessing URL: ${url}`)

		const scrapedVouchers = await scraper.scrape(url)
		console.log(`Found ${scrapedVouchers.length} total vouchers on the site`)

		const newVouchers = await processScrapedVouchers(scrapedVouchers)
		console.log(`Found ${newVouchers.length} new vouchers`)

		allNewVouchers.push(...newVouchers)
	}

	return allNewVouchers
}

export async function processScrapedVouchers(
	scrapedVouchers: ScrapedVoucher[],
): Promise<Voucher[]> {
	// Get existing vouchers
	const existingVouchers = await getVouchers()
	const existingUrls = new Set(existingVouchers.map((v) => v.url))

	const newVouchers: Voucher[] = []

	for (const voucher of scrapedVouchers) {
		// Skip if we already have this voucher
		if (existingUrls.has(voucher.url)) {
			console.log(`Skipping existing voucher: ${voucher.title}`)
			continue
		}

		// Add voucher to database
		console.log(`Adding new voucher: ${voucher.title}`)
		const addedVoucher = await addVoucher(voucher)
		newVouchers.push(addedVoucher)
	}

	// Update last checked timestamp
	await updateLastChecked()

	return newVouchers
}
