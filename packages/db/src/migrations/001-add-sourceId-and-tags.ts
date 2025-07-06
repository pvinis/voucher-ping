import { Low } from "lowdb"
import { Migration } from "./types"
import { Schema } from "../schema"

export const migration001AddSourceIdAndTags: Migration = {
	version: 1,
	name: "Add sourceId and tags to existing vouchers",
	up: async (db: Low<Schema>) => {
		await db.update((data) => {
			for (const voucher of data.vouchers) {
				if (voucher.sourceId && voucher.tags) continue

				if (voucher.url.includes("vouchers.gov.gr")) {
					voucher.sourceId = "vouchers-gov"
					voucher.tags = ["personal"]
				} else if (voucher.url.includes("digitalsme.gov.gr")) {
					voucher.sourceId = "digitalsme-gov"
					voucher.tags = ["work"]
				} else {
					voucher.sourceId = "unknown"
					voucher.tags = ["other"]
				}
			}
		})

		console.log(
			`Migration 001 completed: Updated ${db.data.vouchers.length} vouchers with sourceId and tags`,
		)
	},
}
