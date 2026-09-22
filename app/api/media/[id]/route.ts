import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Serveix un vídeo desat, amb suport de trossos (capçalera Range).
 *
 * Els navegadors demanen els vídeos a trossos i alguns, sobretot els dels
 * reproductors Android, no reprodueixen res si el servidor no els respon
 * amb un 206. Les imatges van per /api/images, que no ho necessita.
 *
 * Pública a propòsit, com les imatges: les pantalles no tenen sessió, els
 * identificadors no s'endevinen i una fila no canvia mai, així que la
 * resposta es pot guardar a la memòria cau per sempre.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const media = await prisma.storedImage.findUnique({ where: { id: params.id } });
    if (!media) {
      return new NextResponse("No trobat", { status: 404 });
    }

    const bytes = Buffer.from(media.bytes);
    const total = bytes.length;
    const headers: Record<string, string> = {
      "Content-Type": media.mime,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
    };

    const range = req.headers.get("range");
    const match = range ? /^bytes=(\d*)-(\d*)$/.exec(range) : null;
    if (match) {
      let start: number;
      let end: number;
      if (match[1] === "" && match[2] !== "") {
        // "bytes=-500": els últims 500 bytes.
        start = Math.max(0, total - parseInt(match[2], 10));
        end = total - 1;
      } else {
        start = match[1] === "" ? 0 : parseInt(match[1], 10);
        end = match[2] === "" ? total - 1 : Math.min(parseInt(match[2], 10), total - 1);
      }
      if (!isFinite(start) || !isFinite(end) || start > end || start >= total) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${total}` },
        });
      }
      return new NextResponse(bytes.subarray(start, end + 1), {
        status: 206,
        headers: {
          ...headers,
          "Content-Range": `bytes ${start}-${end}/${total}`,
          "Content-Length": String(end - start + 1),
        },
      });
    }

    return new NextResponse(bytes, {
      headers: { ...headers, "Content-Length": String(total) },
    });
  } catch (error) {
    console.error("ERROR SERVING MEDIA:", error);
    return new NextResponse("Error", { status: 500 });
  }
}
