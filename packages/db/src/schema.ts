export type Voucher = {
	id: string // unique identifier
	title: string // voucher title/description
	url: string // link to the voucher page
	imageUrl: string // image URL from the website
	discoveredAt: string // ISO timestamp when voucher was found
	sourceId: string // identifier for the source website
	tags: string[] // tags like `personal`, `work`, etc.
}

export type Subscriber = {
	id: string // unique identifier
	email: string
	subscribedAt: string // ISO timestamp when subscriber was added
}

export type Schema = {
	vouchers: Voucher[] // all discovered vouchers
	subscribers: Subscriber[] // all email subscribers
	lastChecked: string // last time we ran the scraper
}

export const defaultData: Schema = {
	vouchers: [],
	subscribers: [],
	lastChecked: new Date().toISOString(),
}
