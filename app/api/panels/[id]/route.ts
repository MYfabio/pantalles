import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  const {
    name,
    logoUrl,
    showClock,
    showWeather,
    showQuote,
    quoteText,
    showSustainability,
    sustainabilityImageUrl,
    screenIds,
  } = await req.json();

  try {
    const panel = await prisma.panel.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        logoUrl,
        showClock,
        showWeather,
        showQuote,
        quoteText,
        showSustainability,
        sustainabilityImageUrl,
      },
    });

    // A screen shows exactly one panel, so assigning it here means detaching it
    // from whichever panel held it before.
    if (screenIds !== undefined) {
      const ids = (screenIds || []) as string[];
      await prisma.$transaction([
        prisma.screen.updateMany({
          where: { panelId: params.id, id: { notIn: ids.length ? ids : ["__none__"] } },
          data: { panelId: null },
        }),
        prisma.screen.updateMany({
          where: { id: { in: ids } },
          data: { panelId: params.id },
        }),
      ]);
    }

    const screens = await prisma.screen.findMany({
      where: { panelId: params.id },
      select: { id: true },
    });

    return NextResponse.json({ ...panel, screenIds: screens.map((s) => s.id) });
  } catch (error: any) {
    console.error("ERROR UPDATING PANEL:", {
      panelId: params.id,
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    });
    return NextResponse.json({ error: "Error actualitzant el panell" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  try {
    const count = await prisma.panel.count();
    if (count <= 1) {
      return NextResponse.json(
        { error: "No es pot esborrar l'unic panell" },
        { status: 400 }
      );
    }

    // Blocks cascade; screens fall back to no panel and show the "not enabled"
    // notice rather than breaking.
    await prisma.panel.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("ERROR DELETING PANEL:", {
      panelId: params.id,
      message: error?.message,
      code: error?.code,
    });
    return NextResponse.json({ error: "Error esborrant el panell" }, { status: 500 });
  }
}
