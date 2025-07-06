import { chromium } from "playwright"

export interface ScrapedVoucher {
	title: string
	url: string
	imageUrl: string
	sourceId: string
	tags: string[]
}

export type Scraper = {
	scrape(url: string, sourceId: string, tags: string[]): Promise<ScrapedVoucher[]>
}

export async function setupBrowser() {
	return await chromium.launch({ headless: true })
}
