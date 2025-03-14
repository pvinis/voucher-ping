import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { defaultData } from "./schema.js";
import type { Schema, Voucher, Subscriber } from "./schema.js";

// Re-export types
export type { Voucher, Subscriber, Schema } from "./schema.js";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

// Get the directory path for the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Define the file path for our database
const dbFilePath = join(__dirname, "..", "data", "db.json");

// Create a Low instance with a JSONFile adapter
let db: Low<Schema>;

export async function getDatabase(): Promise<Low<Schema>> {
	if (!db) {
		const adapter = new JSONFile<Schema>(dbFilePath);
		db = new Low<Schema>(adapter, defaultData);
		await db.read();
	}
	return db;
}

// Voucher operations
export async function addVoucher(
	voucher: Omit<Voucher, "id" | "discoveredAt">,
): Promise<Voucher> {
	const db = await getDatabase();

	// Check if a voucher with the same URL already exists
	const existingVoucher = db.data.vouchers.find((v) => v.url === voucher.url);
	if (existingVoucher) {
		return existingVoucher;
	}

	// Create a new voucher with ID and timestamp
	const newVoucher: Voucher = {
		...voucher,
		id: randomUUID(),
		discoveredAt: new Date().toISOString(),
	};

	db.data.vouchers.push(newVoucher);
	await db.write();

	return newVoucher;
}

export async function getVouchers(): Promise<Voucher[]> {
	const db = await getDatabase();
	return db.data.vouchers;
}

export async function updateLastChecked(): Promise<void> {
	const db = await getDatabase();
	db.data.lastChecked = new Date().toISOString();
	await db.write();
}

// Subscriber operations
export async function addSubscriber(
	email: string,
): Promise<Subscriber | { error: string }> {
	const db = await getDatabase();

	// Validate email format
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		return { error: "Invalid email format" };
	}

	// Check if already subscribed
	const existingSubscriber = db.data.subscribers.find(
		(s) => s.email === email,
	);
	if (existingSubscriber) {
		return { error: "Email already subscribed" };
	}

	// Create new subscriber
	const newSubscriber: Subscriber = {
		email,
		subscribedAt: new Date().toISOString(),
	};

	db.data.subscribers.push(newSubscriber);
	await db.write();

	return newSubscriber;
}

export async function getSubscribers(): Promise<Subscriber[]> {
	const db = await getDatabase();
	return db.data.subscribers;
}

export async function removeSubscriber(email: string): Promise<boolean> {
	const db = await getDatabase();

	const initialLength = db.data.subscribers.length;
	db.data.subscribers = db.data.subscribers.filter((s) => s.email !== email);

	const removed = initialLength > db.data.subscribers.length;
	if (removed) {
		await db.write();
	}

	return removed;
}
