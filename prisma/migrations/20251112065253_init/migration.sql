/*
  Warnings:

  - Added the required column `pathname` to the `FolderImage` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FolderImage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fieldname" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "originalname" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "folderId" INTEGER NOT NULL,
    CONSTRAINT "FolderImage_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FolderImage" ("fieldname", "folderId", "id", "mimetype", "originalname", "size", "url") SELECT "fieldname", "folderId", "id", "mimetype", "originalname", "size", "url" FROM "FolderImage";
DROP TABLE "FolderImage";
ALTER TABLE "new_FolderImage" RENAME TO "FolderImage";
CREATE UNIQUE INDEX "FolderImage_pathname_key" ON "FolderImage"("pathname");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
