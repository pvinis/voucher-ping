import { chromium, type Page } from "playwright";
import type { Voucher } from "@voucher-ping/db";
import { addVoucher, getVouchers, updateLastChecked } from "@voucher-ping/db";

// Interface for scraped voucher without ID and discoveredAt
interface ScrapedVoucher {
	title: string;
	url: string;
	imageUrl: string;
}

/**
 * Scrapes vouchers from the specified URL
 */
export async function scrapeVouchers(url: string): Promise<ScrapedVoucher[]> {
	console.log(`Starting to scrape ${url}...`);

	// Launch browser
	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();

	try {
		// Navigate to the page
		await page.goto(url, { waitUntil: "domcontentloaded" });
		console.log("Page loaded successfully");

		// Extract vouchers
		const vouchers = await extractVouchers(page);
		console.log(`Found ${vouchers.length} vouchers on the page`);

		return vouchers;
	} catch (error) {
		console.error("Error during scraping:", error);
		return [];
	} finally {
		// Close browser
		await browser.close();
		console.log("Browser closed");
	}
}

/**
 * Extracts vouchers from the page
 */
async function extractVouchers(page: Page): Promise<ScrapedVoucher[]> {
	// This is specific to vouchers.gov.gr - we need to find the main image links
	// The actual selector pattern may need to be adjusted based on the site structure
	return await page.evaluate(() => {
		// Using any types here since we're in the browser context,
		// and TypeScript's DOM types are not available in this context
		const vouchers: Array<{
			title: string;
			url: string;
			imageUrl: string;
		}> = [];

		// Look for prominent images with links
		// These selectors are examples and should be adjusted based on the actual site
		const voucherElements = document.querySelectorAll(
			".main-banner a, .voucher-card a, .promotional-banner a",
		);

		voucherElements.forEach((element) => {
			const linkElement = element as any;
			const url = linkElement.href;
			if (!url) return;

			// Get image inside the link
			const imageElement = linkElement.querySelector("img") as any;
			if (!imageElement) return;

			const imageUrl = imageElement.src;
			if (!imageUrl) return;

			// Get title from image alt text, link title, or any other source
			const title =
				imageElement.alt ||
				linkElement.title ||
				linkElement.textContent?.trim() ||
				"Unnamed Voucher";

			vouchers.push({ title, url, imageUrl });
		});

		return vouchers;
	});
}

/**
 * Processes the scraped vouchers by comparing with existing ones
 * and returning only the new ones
 */
export async function processScrapedVouchers(
	scrapedVouchers: ScrapedVoucher[],
): Promise<Voucher[]> {
	// Get existing vouchers
	const existingVouchers = await getVouchers();
	const existingUrls = new Set(existingVouchers.map((v) => v.url));

	// Find new vouchers
	const newVouchers: Voucher[] = [];

	for (const voucher of scrapedVouchers) {
		// Skip if we already have this voucher
		if (existingUrls.has(voucher.url)) {
			console.log(`Skipping existing voucher: ${voucher.title}`);
			continue;
		}

		// Add voucher to database
		console.log(`Adding new voucher: ${voucher.title}`);
		const addedVoucher = await addVoucher(voucher);
		newVouchers.push(addedVoucher);
	}

	// Update last checked timestamp
	await updateLastChecked();

	return newVouchers;
}
