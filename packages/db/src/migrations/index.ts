import { Low } from "lowdb"
import type { Schema } from "../schema"
import { Migration } from "./types"
import { migration001AddSourceIdAndTags } from "./001-add-sourceId-and-tags"

export const migrations: Migration[] = [
	migration001AddSourceIdAndTags,
	// Future migrations go here..
]

export async function runMigrations(db: Low<Schema>): Promise<void> {
	const currentVersion = db.data.migrationVersion ?? 0

	const pendingMigrations = migrations
		.filter((migration) => migration.version > currentVersion)
		.sort((a, b) => a.version - b.version)

	if (pendingMigrations.length === 0) return

	console.log(`Running ${pendingMigrations.length} pending migrations...`)

	for (const migration of pendingMigrations) {
		try {
			console.log(`Running migration ${migration.version}: ${migration.name}`)
			await migration.up(db)

			await db.update((data) => {
				data.migrationVersion = migration.version
			})

			console.log(`Migration ${migration.version} completed successfully`)
		} catch (error) {
			console.error(`Failed to run migration ${migration.version} (${migration.name}):`, error)
			throw error
		}
	}

	console.log(`All migrations completed. Current version: ${db.data.migrationVersion}`)
}

export function getLatestMigrationVersion(): number {
	if (migrations.length === 0) return 0
	return Math.max(...migrations.map((m) => m.version))
}
