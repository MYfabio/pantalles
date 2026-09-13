-- Images stored in the database, so uploads and AI-generated pictures need no
-- external file service.
CREATE TABLE IF NOT EXISTS "StoredImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mime" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
