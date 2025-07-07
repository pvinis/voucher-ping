import initSqlJs from "sql.js"
import type { Voucher } from "@voucher-ping/db"

let SQL: any = null
let dbInstance: any = null
let dbPromise: Promise<any> | null = null

async function initSQL() {
	if (!SQL) {
		SQL = await initSqlJs({
			locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
		})
	}
	return SQL
}

async function getDatabase() {
	if (dbInstance) {
		return dbInstance
	}

	if (dbPromise) {
		return dbPromise
	}

	dbPromise = (async () => {
		try {
			const SQL = await initSQL()

			const response = await fetch(
				"https://raw.githubusercontent.com/pvinis/voucher-ping/main/packages/db/data/db.sqlite",
			)

			if (!response.ok) {
				throw new Error(`Failed to fetch database: ${response.status} ${response.statusText}`)
			}

			const buffer = await response.arrayBuffer()
			dbInstance = new SQL.Database(new Uint8Array(buffer))
			return dbInstance
		} catch (error) {
			dbPromise = null
			throw error
		}
	})()

	return dbPromise
}

export async function fetchVouchersFromSQLite(): Promise<Voucher[]> {
	try {
		const db = await getDatabase()
		const result = db.exec("SELECT * FROM Voucher ORDER BY discoveredAt DESC")

		if (result.length === 0) {
			return []
		}

		const columns = result[0].columns
		const values = result[0].values

		const vouchers: Voucher[] = values.map((row: any[]) => {
			const voucher: any = {}
			columns.forEach((column: string, index: number) => {
				voucher[column] = row[index]
			})

			if (voucher.tags && typeof voucher.tags === "string") {
				try {
					voucher.tags = JSON.parse(voucher.tags)
				} catch (e) {
					voucher.tags = []
				}
			}

			return voucher as Voucher
		})

		return vouchers
	} catch (error) {
		console.error("Error fetching vouchers from SQLite:", error)
		throw error
	}
}

export async function fetchLastScraperRun(): Promise<string | null> {
	try {
		const db = await getDatabase()
		const result = db.exec("SELECT lastRunAt FROM Metadata WHERE id = 'singleton'")

		if (result.length === 0 || result[0].values.length === 0) {
			return null
		}

		const lastRunAt = result[0].values[0][0] as string
		return lastRunAt
	} catch (error) {
		console.error("Error fetching last scraper run from SQLite:", error)
		return null
	}
}

export function closeDatabase(): void {
	if (dbInstance) {
		try {
			dbInstance.close()
		} catch (error) {
			console.error("Error closing database:", error)
		}
		dbInstance = null
		dbPromise = null
	}
}

export function refreshDatabase(): void {
	closeDatabase()
}
