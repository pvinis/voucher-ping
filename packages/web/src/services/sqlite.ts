import initSqlJs from "sql.js"
import type { Voucher, Metadata } from "@voucher-ping/db"

let SQL: any = null

async function initSQL() {
	if (!SQL) {
		SQL = await initSqlJs({
			locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
		})
	}
	return SQL
}

export async function fetchVouchersFromSQLite(): Promise<Voucher[]> {
	try {
		const SQL = await initSQL()

		const response = await fetch(
			"https://raw.githubusercontent.com/pvinis/voucher-ping/main/packages/db/data/db.sqlite",
		)

		if (!response.ok) {
			throw new Error(`Failed to fetch database: ${response.status} ${response.statusText}`)
		}

		const buffer = await response.arrayBuffer()
		const db = new SQL.Database(new Uint8Array(buffer))

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

			// Parse JSON tags field
			if (voucher.tags && typeof voucher.tags === "string") {
				try {
					voucher.tags = JSON.parse(voucher.tags)
				} catch (e) {
					voucher.tags = []
				}
			}

			return voucher as Voucher
		})

		db.close()
		return vouchers
	} catch (error) {
		console.error("Error fetching vouchers from SQLite:", error)
		throw error
	}
}

export async function fetchLastScraperRun(): Promise<string | null> {
	try {
		const SQL = await initSQL()

		const response = await fetch(
			"https://raw.githubusercontent.com/pvinis/voucher-ping/main/packages/db/data/db.sqlite",
		)

		if (!response.ok) {
			throw new Error(`Failed to fetch database: ${response.status} ${response.statusText}`)
		}

		const buffer = await response.arrayBuffer()
		const db = new SQL.Database(new Uint8Array(buffer))

		const result = db.exec("SELECT lastRunAt FROM Metadata WHERE id = 'singleton'")

		if (result.length === 0 || result[0].values.length === 0) {
			db.close()
			return null
		}

		const lastRunAt = result[0].values[0][0] as string
		db.close()
		return lastRunAt
	} catch (error) {
		console.error("Error fetching last scraper run from SQLite:", error)
		return null
	}
}
