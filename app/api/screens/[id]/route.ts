import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  try {
    const screen = await prisma.screen.findUnique({
      where: { id: params.id },
      include: { urls: { orderBy: { order: "asc" } } },
    });
    if (!screen) {
      return NextResponse.json({ error: "No trobada" }, { status: 404 });
    }
    return NextResponse.json(screen);
  } catch (error) {
    return NextResponse.json({ error: "Error obtenint pantalla" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  const { name, slug, location, active, urls } = await req.json();

  try {
    const screen = await prisma.screen.update({
      where: { id: params.id },
      data: { name, slug, location, active, updatedAt: new Date() },
    });

    // The rotation list is short and edited as a whole, so it is simpler to
    // replace it than to diff each row.
    if (Array.isArray(urls)) {
      const rows = (urls as any[])
        .filter((u) => u?.url?.trim())
        .map((u, order) => ({
          screenId: params.id,
          label: (u.label || "").trim() || "Sense nom",
          url: u.url.trim(),
          seconds: Math.max(5, Number(u.seconds) || 30),
          enabled: u.enabled !== false,
          order,
        }));

      await prisma.$transaction([
        prisma.screenUrl.deleteMany({ where: { screenId: params.id } }),
        ...(rows.length ? [prisma.screenUrl.createMany({ data: rows })] : []),
      ]);
    }

    const updated = await prisma.screen.findUnique({
      where: { id: params.id },
      include: { urls: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("ERROR UPDATING SCREEN:", error);
    return NextResponse.json({ error: "Error actualitzant pantalla" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  try {
    await prisma.screen.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error eliminant pantalla" }, { status: 500 });
  }
}