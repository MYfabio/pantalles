-- Aparença per panell (color de capçalera i peu, mida de lletra) i vídeo als blocs.
-- Tot opcional: els panells i blocs que ja existeixen no canvien de res.
ALTER TABLE "Panel"
  ADD COLUMN "themePrimary" TEXT,
  ADD COLUMN "themeDark" TEXT,
  ADD COLUMN "fontScale" DOUBLE PRECISION NOT NULL DEFAULT 1;

ALTER TABLE "PanelBlock"
  ADD COLUMN "videoUrl" TEXT;
