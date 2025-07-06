import type { VoucherToBeAdded } from "@voucher-ping/db"
import type { Voucher } from "@prisma/client"
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

export async function scrape(): Promise<Voucher[]> {
	const allNewVouchers: Voucher[] = []

	for (const [url, config] of Object.entries(URLS_TO_SCRAPE)) {
		console.log(`\nProcessing URL: ${url}`)

		const scrapedVouchers = await config.scraper.scrape(url)
		console.log(`Found ${scrapedVouchers.length} total vouchers on the site`)

		const newVouchers = await processScrapedVouchers(scrapedVouchers, config.sourceId, config.tags)
		console.log(`Found ${newVouchers.length} new vouchers`)

		allNewVouchers.push(...newVouchers)
	}

	await updateLastScraperRun()

	return allNewVouchers
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
