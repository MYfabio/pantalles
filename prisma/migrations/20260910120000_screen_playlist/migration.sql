-- Per-screen rotation list, so the player devices can fetch what to show
-- instead of each holding its own configuration.
CREATE TABLE IF NOT EXISTS "ScreenUrl" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "screenId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "seconds" INTEGER NOT NULL DEFAULT 30,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ScreenUrl_screenId_order_idx" ON "ScreenUrl"("screenId", "order");

ALTER TABLE "ScreenUrl" DROP CONSTRAINT IF EXISTS "ScreenUrl_screenId_fkey";
ALTER TABLE "ScreenUrl" ADD CONSTRAINT "ScreenUrl_screenId_fkey"
    FOREIGN KEY ("screenId") REFERENCES "Screen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
