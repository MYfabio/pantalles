import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Serves a stored image.
 *
 * Public on purpose: the panels that show these images are public pages, and
 * the player devices have no session. Ids are unguessable cuids and a row
 * never changes after it is written, so the response can be cached for good.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const image = await prisma.storedImage.findUnique({ where: { id: params.id } });
    if (!image) {
      return new NextResponse("No trobada", { status: 404 });
    }
    return new NextResponse(Buffer.from(image.bytes), {
      headers: {
        "Content-Type": image.mime,
        "Content-Length": String(image.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("ERROR SERVING IMAGE:", error);
    return new NextResponse("Error", { status: 500 });
  }
}
