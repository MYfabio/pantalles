import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Panel images are shown at ~1000px wide; anything larger than this is a
// mistake (a raw camera file) rather than a need, and Postgres rows should
// stay a sensible size.
const MAX_BYTES = 8 * 1024 * 1024;

/** Tipus real a partir dels primers bytes; el `file.type` el decideix el navegador i no és de fiar. */
function tipusReal(b: Buffer): string | null {
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 6 && b.subarray(0, 6).toString("ascii").startsWith("GIF8")) return "image/gif";
  if (b.length >= 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

/**
 * Stores an uploaded image in the database and returns its URL.
 *
 * Replaces the Vercel Blob upload: the school runs everything on Railway, and
 * a handful of panel images does not justify a second service with its own
 * token to keep alive.
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
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "El fitxer ha de ser una imatge" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "La imatge és massa gran (màxim 8 MB)" },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const mime = tipusReal(bytes);
    if (!mime) {
      return NextResponse.json({ error: "Format no admès: PNG, JPG, GIF o WebP" }, { status: 400 });
    }
    const image = await prisma.storedImage.create({
      data: { mime, bytes, size: bytes.length },
      select: { id: true },
    });

    return NextResponse.json({ url: `/api/images/${image.id}` });
  } catch (error: any) {
    console.error("ERROR UPLOADING FILE:", { message: error?.message });
    return NextResponse.json({ error: "Error pujant el fitxer" }, { status: 500 });
  }
}
