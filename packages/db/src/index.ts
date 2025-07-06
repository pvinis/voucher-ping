import { Low } from "lowdb"
import { JSONFile } from "lowdb/node"
import { defaultData } from "./schema.js"
import type { Schema, Voucher } from "./schema.js"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { randomUUID } from "crypto"

export type { Voucher, Subscriber, Schema } from "./schema.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbFilePath = join(__dirname, "..", "data", "db.json")

let db: Low<Schema>

export async function getDatabase(): Promise<Low<Schema>> {
	if (!db) {
		const adapter = new JSONFile<Schema>(dbFilePath)
		db = new Low<Schema>(adapter, defaultData)
		await db.read()
	}
	return db
}

export async function addVoucher(voucher: Omit<Voucher, "id" | "discoveredAt">): Promise<Voucher> {
	const db = await getDatabase()

	const existingVoucher = db.data.vouchers.find((v) => v.url === voucher.url)
	if (existingVoucher) {
		return existingVoucher
	}

	const newVoucher: Voucher = {
		...voucher,
		id: randomUUID(),
		discoveredAt: new Date().toISOString(),
	}

	await db.update(({ vouchers }) => vouchers.push(newVoucher))

	return newVoucher
}

export async function getVouchers(): Promise<Voucher[]> {
	const db = await getDatabase()
	return db.data.vouchers
}

export async function updateLastChecked(): Promise<void> {
	await db.update(({ lastChecked }) => (lastChecked = new Date().toISOString()))
}

export async function getSubscribers(): Promise<any[]> {
	const db = await getDatabase()
	return db.data.subscribers || []
}
