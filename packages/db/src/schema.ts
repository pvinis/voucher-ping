import { getLatestMigrationVersion } from "./migrations"

export type Subscriber = {
	id: string // unique identifier
	email: string
	subscribedAt: string // ISO timestamp when subscriber was added
}

export type Schema = {
	vouchers: Voucher[] // all discovered vouchers
	subscribers: Subscriber[] // all email subscribers
	lastChanged: string // last time there were changed in the db
	migrationVersion: number // latest completed migration version
}

}
