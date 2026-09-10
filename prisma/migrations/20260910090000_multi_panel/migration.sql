-- Multi-panel: each Screen points at its own Panel, so different screens can
-- show different content.
--
-- Note on the guards below: PanelBlock, SustainabilityIndicator, PanelSettings
-- and PanelScreen were created with `prisma db push` and never recorded as
-- migrations, so the migration history is behind the deployed database. Every
-- statement here is written to be a no-op when the object already exists, so
-- this file works both against the live database and against a fresh one
-- created from the migration history alone.

-- Tables that only ever existed via db push.
CREATE TABLE IF NOT EXISTS "PanelBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "typeText" TEXT NOT NULL,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SustainabilityIndicator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "unitat" TEXT NOT NULL,
    "valorInicial" DOUBLE PRECISION NOT NULL,
    "increment" DOUBLE PRECISION NOT NULL,
    "dataInici" TEXT NOT NULL,
    "frequencia" TEXT NOT NULL DEFAULT 'dia',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "SustainabilityIndicator_key_key" ON "SustainabilityIndicator"("key");

-- The new Panel entity.
CREATE TABLE IF NOT EXISTS "Panel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "showClock" BOOLEAN NOT NULL DEFAULT true,
    "showWeather" BOOLEAN NOT NULL DEFAULT true,
    "showQuote" BOOLEAN NOT NULL DEFAULT false,
    "quoteText" TEXT,
    "showSustainability" BOOLEAN NOT NULL DEFAULT true,
    "sustainabilityImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Carry the old singleton panel settings across, when they exist.
DO $$
BEGIN
    IF to_regclass('"PanelSettings"') IS NOT NULL THEN
        INSERT INTO "Panel" (
            "id", "name", "logoUrl", "showClock", "showWeather", "showQuote",
            "quoteText", "showSustainability", "sustainabilityImageUrl", "updatedAt"
        )
        SELECT
            'main', 'Panell general', "logoUrl", "showClock", "showWeather", "showQuote",
            "quoteText", "showSustainability", "sustainabilityImageUrl", CURRENT_TIMESTAMP
        FROM "PanelSettings"
        WHERE "id" = 'main'
        ON CONFLICT ("id") DO NOTHING;
    END IF;
END $$;

-- Fresh database, or a live one with no settings row: start from the defaults.
INSERT INTO "Panel" ("id", "name", "updatedAt")
VALUES ('main', 'Panell general', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Attach every existing block to that first panel.
ALTER TABLE "PanelBlock" ADD COLUMN IF NOT EXISTS "panelId" TEXT;
ALTER TABLE "PanelBlock" ADD COLUMN IF NOT EXISTS "startsAt" TIMESTAMP(3);
ALTER TABLE "PanelBlock" ADD COLUMN IF NOT EXISTS "endsAt" TIMESTAMP(3);
UPDATE "PanelBlock" SET "panelId" = 'main' WHERE "panelId" IS NULL;
ALTER TABLE "PanelBlock" ALTER COLUMN "panelId" SET NOT NULL;

-- The block key is now only unique within its panel.
ALTER TABLE "PanelBlock" DROP CONSTRAINT IF EXISTS "PanelBlock_key_key";
DROP INDEX IF EXISTS "PanelBlock_key_key";
CREATE UNIQUE INDEX IF NOT EXISTS "PanelBlock_panelId_key_key" ON "PanelBlock"("panelId", "key");

ALTER TABLE "PanelBlock" DROP CONSTRAINT IF EXISTS "PanelBlock_panelId_fkey";
ALTER TABLE "PanelBlock" ADD CONSTRAINT "PanelBlock_panelId_fkey"
    FOREIGN KEY ("panelId") REFERENCES "Panel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Screens now reference a panel directly instead of through a join table.
ALTER TABLE "Screen" ADD COLUMN IF NOT EXISTS "panelId" TEXT;

DO $$
BEGIN
    IF to_regclass('"PanelScreen"') IS NOT NULL THEN
        UPDATE "Screen" s
        SET "panelId" = 'main'
        WHERE EXISTS (SELECT 1 FROM "PanelScreen" ps WHERE ps."screenId" = s."id");
    END IF;
END $$;

ALTER TABLE "Screen" DROP CONSTRAINT IF EXISTS "Screen_panelId_fkey";
ALTER TABLE "Screen" ADD CONSTRAINT "Screen_panelId_fkey"
    FOREIGN KEY ("panelId") REFERENCES "Panel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DROP TABLE IF EXISTS "PanelScreen";
DROP TABLE IF EXISTS "PanelSettings";
