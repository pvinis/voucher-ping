import type { Page } from "playwright"
import { setupBrowser, type ScrapedVoucher, type Scraper } from "./shared"

export const scraperDigitalsmeGov: Scraper = {
	async scrape(url: string): Promise<ScrapedVoucher[]> {
		console.log(`Starting to scrape ${url}...`)

		const browser = await setupBrowser()
		const page = await browser.newPage()

		try {
			await page.goto(url, { waitUntil: "domcontentloaded" })
			console.log("Page loaded successfully")

			// Scroll to bottom to trigger lazy loading
			await page.evaluate(() => {
				window.scrollTo(0, document.body.scrollHeight)
			})
			
			// Wait for images to load
			await page.waitForTimeout(1000)

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

		const postElements = document.querySelectorAll(".et_pb_post")
		console.log(`Found ${postElements.length} post elements`)

		postElements.forEach((element) => {
			const linkElement = element.querySelector(".et_pb_image_container a") as any
			if (!linkElement) return

			const url = linkElement.href
			if (!url) return

			const imageElement = element.querySelector(".et_pb_image_container img") as any
			if (!imageElement) return

			// Check for lazy loading data attributes first
			let imageUrl = imageElement.getAttribute('data-src') || 
						   imageElement.getAttribute('data-lazy') || 
						   imageElement.getAttribute('data-lazyloaded') || 
						   imageElement.getAttribute('data-original') ||
						   imageElement.src
			
			if (!imageUrl || imageUrl.startsWith('data:')) {
				// If still a placeholder, use default digitalsme logo
				imageUrl = "https://digitalsme.gov.gr/wp-content/uploads/2022/06/digitalsme_logo-400x250.jpg"
			}

			let title = ""

			if (imageElement.alt) {
				title = imageElement.alt
			} else {
				const titleElement = element.querySelector(".et_pb_post_title a") as any
				if (titleElement?.textContent) {
					title = titleElement.textContent.trim()
				} else {
					const contentElement = element.querySelector(".et_pb_post_content") as any
					if (contentElement?.textContent) {
						const words = contentElement.textContent.trim().split(/\s+/)
						title = words.slice(0, 6).join(" ") + (words.length > 6 ? "..." : "")
					} else {
						try {
							const urlPath = new URL(url).pathname
							title = urlPath.split("/").pop() || urlPath
						} catch {
							title = "Unnamed Announcement"
						}
					}
				}
			}

			console.log(`Found announcement: ${title} - ${url}`)
			vouchers.push({ title, url, imageUrl })
		})

		return vouchers
	})
}
