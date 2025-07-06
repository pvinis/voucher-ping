/*
  Warnings:

  - The primary key for the `Voucher` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- CreateTable
CREATE TABLE "Metadata" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "lastRunAt" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Voucher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "discoveredAt" TEXT NOT NULL
);
INSERT INTO "new_Voucher" ("discoveredAt", "id", "imageUrl", "title", "url") SELECT "discoveredAt", "id", "imageUrl", "title", "url" FROM "Voucher";
DROP TABLE "Voucher";
ALTER TABLE "new_Voucher" RENAME TO "Voucher";
CREATE UNIQUE INDEX "Voucher_url_key" ON "Voucher"("url");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
