import { Low } from "lowdb"
import { Schema } from "../schema"

export interface Migration {
	version: number // migration version number (1, 2, 3, etc.)
	name: string
	up: (db: Low<Schema>) => Promise<void>
}
