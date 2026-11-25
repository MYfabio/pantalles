import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureOwnPanel, loadFromScreen, undoLoad } from "@/lib/screen-panel";

export const dynamic = "force-dynamic";

async function describe(screenId: string) {
  const panelId = await ensureOwnPanel(screenId);
  const [screen, panel] = await Promise.all([
    prisma.screen.findUniqueOrThrow({ where: { id: screenId } }),
    prisma.panel.findUniqueOrThrow({ where: { id: panelId } }),
  ]);
  return {
    screen: {
      id: screen.id,
      name: screen.name,
      slug: screen.slug,
      location: screen.location,
      active: screen.active,
    },
    panel,
    canUndo: Boolean(screen.previousPanelId),
  };
}

/** El contingut propi d'una pantalla (es crea o se separa si cal). */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }
  try {
    const exists = await prisma.screen.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Pantalla no trobada" }, { status: 404 });
    return NextResponse.json(await describe(params.id), {
      headers: { "Cache-Control": "no-store, must-revalidate" },
    });
  } catch (error: any) {
    console.error("ERROR SCREEN PANEL:", { screenId: params.id, message: error?.message });
    return NextResponse.json({ error: "Error obtenint el contingut" }, { status: 500 });
  }
}

/** Carrega el contingut d'una altra pantalla, o desfà l'última càrrega. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }
  const { action, fromScreenId } = await req.json();
  try {
    if (action === "load") {
      if (!fromScreenId || typeof fromScreenId !== "string") {
        return NextResponse.json({ error: "Falta la pantalla d'origen" }, { status: 400 });
      }
      await loadFromScreen(params.id, fromScreenId);
    } else if (action === "undo") {
      await undoLoad(params.id);
    } else {
      return NextResponse.json({ error: "Acció desconeguda" }, { status: 400 });
    }
    return NextResponse.json(await describe(params.id));
  } catch (error: any) {
    console.error("ERROR SCREEN PANEL ACTION:", { screenId: params.id, action, message: error?.message });
    return NextResponse.json({ error: error?.message || "Error" }, { status: 400 });
  }
}
