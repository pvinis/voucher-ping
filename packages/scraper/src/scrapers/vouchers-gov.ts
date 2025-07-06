import type { Page } from "playwright"
import { ScrapedVoucher, setupBrowser, type Scraper } from "./shared"

export const scraperVouchersGov: Scraper = {
	async scrape(url: string): Promise<ScrapedVoucher[]> {
		console.log(`Starting to scrape ${url}...`)

		const browser = await setupBrowser()
		const page = await browser.newPage()

		try {
			await page.goto(url, { waitUntil: "domcontentloaded" })
			console.log("Page loaded successfully")

			const vouchers = await extractVouchers(page)
			console.log(`Found ${vouchers.length} vouchers on the page`)

			return vouchers
		} catch (error) {
			console.error("Error during scraping:", error)
			return []
		} finally {
			await browser.close()
			console.log("Browser closed")
		}
	},
}

async function extractVouchers(page: Page): Promise<ScrapedVoucher[]> {
	return await page.evaluate(() => {
		const vouchers: Array<ScrapedVoucher> = []

		const voucherElements = document.querySelectorAll(".views-row")
		console.log(`Found ${voucherElements.length} voucher elements`)

		voucherElements.forEach((element) => {
			const linkElement = element.querySelector(".views-field-field-promo-text a") as any
			if (!linkElement) return

			const url = linkElement.href
			if (!url) return

			const imageElement = element.querySelector(".views-field-field-banner-image img") as any
			if (!imageElement) return

			const imageUrl = imageElement.src
			if (!imageUrl) return

			let title = ""
			const textContent = linkElement.textContent?.trim()

			if (textContent) {
				const words = textContent.split(/\s+/)
				title = words.slice(0, 6).join(" ") + (words.length > 6 ? "..." : "")
			} else if (imageElement.alt) {
				title = imageElement.alt
			} else {
				try {
					const urlPath = new URL(url).pathname
					title = urlPath.split("/").pop() || urlPath
				} catch {
					title = "Unnamed Voucher"
				}
			}

			console.log(`Found voucher: ${title} - ${url}`)
			vouchers.push({ title, url, imageUrl })
		})

		return vouchers
	})
}
