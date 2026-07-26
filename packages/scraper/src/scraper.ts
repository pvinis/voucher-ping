import type { VoucherToBeAdded, Voucher } from "@voucher-ping/db"
import { addVoucher, getVouchers, updateLastScraperRun } from "@voucher-ping/db"
import { scraperVouchersGov } from "./scrapers/vouchers-gov"
import { scraperDigitalsmeGov } from "./scrapers/digitalsme-gov"
import type { ScrapedVoucher } from "./scrapers/shared"

const URLS_TO_SCRAPE = {
	"https://vouchers.gov.gr": {
		scraper: scraperVouchersGov,
		sourceId: "vouchers-gov",
		tags: ["personal"],
	},
	"https://digitalsme.gov.gr/νέα-ανακοινώσεις": {
		scraper: scraperDigitalsmeGov,
		sourceId: "digitalsme-gov",
		tags: ["work"],
	},
}

export type ScrapeResult = {
	newVouchers: Voucher[]
	/** Sources that threw. Non-empty means the run must be treated as failed. */
	failures: { url: string; error: unknown }[]
	/** Sources that loaded but matched no elements — usually a changed layout. */
	emptySources: string[]
}

export async function scrape(): Promise<ScrapeResult> {
	const newVouchers: Voucher[] = []
	const failures: ScrapeResult["failures"] = []
	const emptySources: string[] = []

	for (const [url, config] of Object.entries(URLS_TO_SCRAPE)) {
		console.log(`\nProcessing URL: ${url}`)

		// One bad source must not hide results from the others, but it must still
		// fail the run — a silently empty scrape is indistinguishable from
		// "no new vouchers today".
		try {
			const scrapedVouchers = await config.scraper.scrape(url)
			console.log(`Found ${scrapedVouchers.length} total vouchers on the site`)

			if (scrapedVouchers.length === 0) {
				console.warn(`No vouchers matched on ${url} — the page layout may have changed`)
				emptySources.push(url)
			}

			const added = await processScrapedVouchers(scrapedVouchers, config.sourceId, config.tags)
			console.log(`Found ${added.length} new vouchers`)

			newVouchers.push(...added)
		} catch (error) {
			console.error(`Failed to scrape ${url}:`, error)
			failures.push({ url, error })
		}
	}

	await updateLastScraperRun()

	return { newVouchers, failures, emptySources }
}

export async function processScrapedVouchers(
	scrapedVouchers: ScrapedVoucher[],
	sourceId: string,
	tags: string[],
): Promise<Voucher[]> {
	const existingVouchers = await getVouchers()
	const existingUrls = new Set(existingVouchers.map((v) => v.url))

	const newVouchers: Voucher[] = []

	for (const voucher of scrapedVouchers) {
		if (existingUrls.has(voucher.url)) {
			console.log(`Skipping existing voucher: ${voucher.title}`)
			continue
		}

		console.log(`Adding new voucher: ${voucher.title}`)
		const fullVoucher: VoucherToBeAdded = {
			...voucher,
			sourceId,
			tags,
		}
		const addedVoucher = await addVoucher(fullVoucher)
		newVouchers.push(addedVoucher)
	}

	return newVouchers
}
