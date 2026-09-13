import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Panel images are shown at ~1000px wide; anything larger than this is a
// mistake (a raw camera file) rather than a need, and Postgres rows should
// stay a sensible size.
const MAX_BYTES = 8 * 1024 * 1024;

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
    const image = await prisma.storedImage.create({
      data: { mime: file.type, bytes, size: bytes.length },
      select: { id: true },
    });

    return NextResponse.json({ url: `/api/images/${image.id}` });
  } catch (error: any) {
    console.error("ERROR UPLOADING FILE:", { message: error?.message });
    return NextResponse.json({ error: "Error pujant el fitxer" }, { status: 500 });
  }
}
