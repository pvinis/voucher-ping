import { chromium, type Page } from "playwright"

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

const NAVIGATION_TIMEOUT_MS = 60_000

export async function setupBrowser() {
	return await chromium.launch({ headless: true })
}

/**
 * Navigates and fails on an error status. Without this an HTTP 404 or 503 just
 * yields a page with no matching elements, which the run would otherwise report
 * as "no new vouchers".
 */
export async function gotoOrThrow(page: Page, url: string) {
	const response = await page.goto(url, {
		waitUntil: "domcontentloaded",
		timeout: NAVIGATION_TIMEOUT_MS,
	})

	const status = response?.status()
	if (status !== undefined && status >= 400) {
		throw new Error(`${url} returned HTTP ${status}`)
	}

	console.log(`Page loaded successfully (HTTP ${status ?? "unknown"})`)
}
