-- Copia de seguretat del contingut anterior quan una pantalla en carrega un altre,
-- per poder desfer la carrega.
ALTER TABLE "Screen" ADD COLUMN IF NOT EXISTS "previousPanelId" TEXT;
