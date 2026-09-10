import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  const panelId = req.nextUrl.searchParams.get("panelId");

  try {
    const blocks = await prisma.panelBlock.findMany({
      where: panelId ? { panelId } : undefined,
      orderBy: { order: "asc" },
    });
    return NextResponse.json(blocks, { headers: { "Cache-Control": "no-store, must-revalidate" } });
  } catch (error) {
    console.error("ERROR PANEL BLOCKS:", error);
    return NextResponse.json({ error: "Error obtenint els blocs" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  const { blocks } = await req.json();

  if (!Array.isArray(blocks)) {
    return NextResponse.json({ error: "Falten camps obligatoris" }, { status: 400 });
  }

  try {
    await prisma.$transaction(
      (blocks as { id: string; order: number }[]).map((b) =>
        prisma.panelBlock.update({
          where: { id: b.id },
          data: { order: b.order },
        })
      )
    );
    const updated = await prisma.panelBlock.findMany({ orderBy: { order: "asc" } });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("ERROR REORDERING PANEL BLOCKS:", {
      blocks,
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    });
    return NextResponse.json({ error: "Error reordenant els blocs" }, { status: 500 });
  }
}
