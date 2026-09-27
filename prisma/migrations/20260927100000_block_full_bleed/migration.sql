-- Un bloc pot ocupar tota la pantalla sota la capcalera nomes amb la seva imatge o video.
ALTER TABLE "PanelBlock" ADD COLUMN "fullBleed" BOOLEAN NOT NULL DEFAULT false;
