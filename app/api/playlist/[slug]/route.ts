import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * The public origin as the device sees it.
 *
 * `req.nextUrl.origin` is the address the server bound to (0.0.0.0:3000 behind
 * Railway's proxy), which is useless to a TV box, so trust the proxy headers.
 */
function publicOrigin(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!host) return req.nextUrl.origin;
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

/**
 * What a player device should show, in order.
 *
 * Deliberately public and unauthenticated: the devices are TV boxes with no
 * one to log them in, and this only exposes URLs that are already public. The
 * only configuration on the device is the screen slug.
 *
 *   GET /api/playlist/taller
 *   { "screen": "taller", "reloadSeconds": 300, "items": [ ... ] }
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const screen = await prisma.screen.findUnique({
      where: { slug: params.slug },
      include: { urls: { where: { enabled: true }, orderBy: { order: "asc" } } },
    });

    if (!screen) {
      return NextResponse.json({ error: "Pantalla no trobada" }, { status: 404 });
    }

    if (!screen.active) {
      return NextResponse.json(
        { screen: screen.slug, active: false, reloadSeconds: 300, items: [] },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const items = screen.urls.map((u) => ({
      label: u.label,
      url: u.url,
      seconds: u.seconds,
    }));

    // A screen with no list configured still works: it shows its own panel.
    if (items.length === 0 && screen.panelId) {
      items.push({
        label: "Panell",
        url: `${publicOrigin(req)}/panel/${screen.slug}`,
        seconds: 60,
      });
    }

    return NextResponse.json(
      {
        screen: screen.slug,
        name: screen.name,
        active: true,
        // How often the device should re-read this playlist.
        reloadSeconds: 300,
        items,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("ERROR PLAYLIST:", error);
    return NextResponse.json({ error: "Error obtenint la llista" }, { status: 500 });
  }
}
