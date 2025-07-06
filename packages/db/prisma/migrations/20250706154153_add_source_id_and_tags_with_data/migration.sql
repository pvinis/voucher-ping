/*
  Warnings:

  - Added the required column `sourceId` to the `Voucher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tags` to the `Voucher` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Voucher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "discoveredAt" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "tags" JSONB NOT NULL
);
INSERT INTO "new_Voucher" ("discoveredAt", "id", "imageUrl", "title", "url", "sourceId", "tags") 
SELECT 
    "discoveredAt", 
    "id", 
    "imageUrl", 
    "title", 
    "url",
    CASE 
        WHEN "url" LIKE 'https://vouchers.gov%' THEN 'vouchers-gov'
        WHEN "url" LIKE 'https://digitalsme.gov.gr%' THEN 'digitalsme-gov'
        ELSE 'unknown'
    END as "sourceId",
    CASE 
        WHEN "url" LIKE 'https://vouchers.gov%' THEN '["personal"]'
        WHEN "url" LIKE 'https://digitalsme.gov.gr%' THEN '["work"]'
        ELSE '[]'
    END as "tags"
FROM "Voucher";
DROP TABLE "Voucher";
ALTER TABLE "new_Voucher" RENAME TO "Voucher";
CREATE UNIQUE INDEX "Voucher_url_key" ON "Voucher"("url");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
