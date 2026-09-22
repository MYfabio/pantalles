import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VIDEO_MAX_BYTES, VIDEO_TYPES } from "@/lib/media-limits";

export const dynamic = "force-dynamic";

/**
 * Desa el vídeo d'un bloc i en retorna l'adreça.
 *
 * Va a la mateixa taula que les imatges (mime, bytes, mida): és el mateix
 * problema, un fitxer que no canvia mai i que les pantalles demanen amb una
 * adreça pública. La durada la comprova l'editor abans de pujar-lo, perquè
 * llegir-la aquí voldria dir descodificar el vídeo al servidor; el que sí que
 * es comprova és el tipus i la mida, que són els que protegeixen la base de
 * dades.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Falta el fitxer" }, { status: 400 });
    }
    if (!VIDEO_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "El vídeo ha de ser MP4 o WebM" }, { status: 400 });
    }
    if (file.size > VIDEO_MAX_BYTES) {
      return NextResponse.json(
        { error: `El vídeo és massa gran (màxim ${Math.round(VIDEO_MAX_BYTES / 1024 / 1024)} MB)` },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const media = await prisma.storedImage.create({
      data: { mime: file.type, bytes, size: bytes.length },
      select: { id: true },
    });

    return NextResponse.json({ url: `/api/media/${media.id}` });
  } catch (error: any) {
    console.error("ERROR UPLOADING VIDEO:", { message: error?.message });
    return NextResponse.json({ error: "Error pujant el vídeo" }, { status: 500 });
  }
}
