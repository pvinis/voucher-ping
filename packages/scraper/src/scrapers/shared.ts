import { chromium } from "playwright"

export interface ScrapedVoucher {
	title: string
	url: string
	imageUrl: string
}

export type Scraper = {
	scrape(url: string): Promise<ScrapedVoucher[]>
}

export async function setupBrowser() {
	return await chromium.launch({ headless: true })
}
