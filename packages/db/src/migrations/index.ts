import { Low } from "lowdb"
import type { Schema } from "../schema"
import { migration001AddSourceIdAndTags } from "./001-add-sourceId-and-tags"
import { Migration } from "./types"

export const migrations: Migration[] = [
	migration001AddSourceIdAndTags,
	// Future migrations go here..
]

export async function runMigrations(db: Low<Schema>): Promise<void> {
	for (const migration of migrations) {
		try {
			await migration.up(db)
		} catch (error) {
			console.error(`Failed to run migration ${migration.id} (${migration.name}):`, error)
			throw error
		}
	}
}
