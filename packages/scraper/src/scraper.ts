import { chromium, type Page } from "playwright"
import type { Voucher } from "@voucher-ping/db"
import { addVoucher, getVouchers, updateLastChecked } from "@voucher-ping/db"

// Interface for scraped voucher without ID and discoveredAt
interface ScrapedVoucher {
	title: string
	url: string
	imageUrl: string
}

/**
 * Scrapes vouchers from the specified URL
 */
export async function scrapeVouchers(url: string): Promise<ScrapedVoucher[]> {
	console.log(`Starting to scrape ${url}...`)

	// Launch browser
	const browser = await chromium.launch({ headless: true })
	const page = await browser.newPage()

	try {
		// Navigate to the page
		await page.goto(url, { waitUntil: "domcontentloaded" })
		console.log("Page loaded successfully")

		// Extract vouchers
		const vouchers = await extractVouchers(page)
		console.log(`Found ${vouchers.length} vouchers on the page`)

		return vouchers
	} catch (error) {
		console.error("Error during scraping:", error)
		return []
	} finally {
		// Close browser
		await browser.close()
		console.log("Browser closed")
	}
}

/**
 * Extracts vouchers from the page
 */
async function extractVouchers(page: Page): Promise<ScrapedVoucher[]> {
	// This is specific to vouchers.gov.gr - we need to find the voucher elements
	return await page.evaluate(() => {
		// Using any types here since we're in the browser context,
		// and TypeScript's DOM types are not available in this context
		const vouchers: Array<{
			title: string
			url: string
			imageUrl: string
		}> = []

		// Target the voucher containers based on the actual site structure
		const voucherElements = document.querySelectorAll(".views-row")
		console.log(`Found ${voucherElements.length} voucher elements`)

		voucherElements.forEach((element) => {
			// Get the link from the promo text section
			const linkElement = element.querySelector(".views-field-field-promo-text a") as any
			if (!linkElement) return

			const url = linkElement.href
			if (!url) return

			// Get the image from the banner image section
			const imageElement = element.querySelector(".views-field-field-banner-image img") as any
			if (!imageElement) return

			const imageUrl = imageElement.src
			if (!imageUrl) return

			// Get title - use the first few words of the text or the URL path
			let title = ""
			const textContent = linkElement.textContent?.trim()

			if (textContent) {
				// Use first 6 words as title
				const words = textContent.split(/\s+/)
				title = words.slice(0, 6).join(" ") + (words.length > 6 ? "..." : "")
			} else if (imageElement.alt) {
				// Fallback to image alt text
				title = imageElement.alt
			} else {
				// Second fallback: use the URL path as title
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

/**
 * Processes the scraped vouchers by comparing with existing ones
 * and returning only the new ones
 */
export async function processScrapedVouchers(
	scrapedVouchers: ScrapedVoucher[],
): Promise<Voucher[]> {
	// Get existing vouchers
	const existingVouchers = await getVouchers()
	const existingUrls = new Set(existingVouchers.map((v) => v.url))

	// Find new vouchers
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
