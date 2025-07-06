import { chromium } from "playwright"

export type ScrapedVoucher = {
	title: string
	url: string
	imageUrl: string
}
export type ExtractedVoucher = {
	sourceId: string
	tags: string[]
}

export type Voucher = ScrapedVoucher & ExtractedVoucher

export type Scraper = {
	scrape(url: string): Promise<ScrapedVoucher[]>
}

export async function setupBrowser() {
	return await chromium.launch({ headless: true })
}
