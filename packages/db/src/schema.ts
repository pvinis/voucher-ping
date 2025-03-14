/**
 * Schema definitions for the Voucher Ping application
 */

export type Voucher = {
	id: string; // Unique identifier
	title: string; // Voucher title/description
	url: string; // Link to the voucher page
	imageUrl: string; // Image URL from the website
	discoveredAt: string; // ISO timestamp when we found this voucher
};

export type Subscriber = {
	email: string; // Subscriber's email
	subscribedAt: string; // When they subscribed
};

export type Schema = {
	vouchers: Voucher[]; // All discovered vouchers
	subscribers: Subscriber[]; // All email subscribers
	lastChecked: string; // Last time we ran the scraper
};

export const defaultData: Schema = {
	vouchers: [],
	subscribers: [],
	lastChecked: new Date().toISOString(),
};
