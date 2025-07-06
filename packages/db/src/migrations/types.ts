import { Low } from "lowdb"
import { Schema } from "../schema"

export interface Migration {
	id: string
	name: string
	up: (db: Low<Schema>) => Promise<void>
}
