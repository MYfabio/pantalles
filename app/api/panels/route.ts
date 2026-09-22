import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultBlocksFor } from "@/lib/panel-defaults";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  try {
    const panels = await prisma.panel.findMany({
      orderBy: { createdAt: "asc" },
      include: { screens: { select: { id: true } } },
    });
    return NextResponse.json(
      panels.map(({ screens, ...panel }) => ({
        ...panel,
        screenIds: screens.map((s) => s.id),
      })),
      { headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
  } catch (error) {
    console.error("ERROR PANELS:", error);
    return NextResponse.json({ error: "Error obtenint els panells" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  const { name, copyFromId } = await req.json();

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Falta el nom del panell" }, { status: 400 });
  }

  try {
    // Copying an existing panel is the usual way to start: it keeps the header
    // settings and the wording, which is what people want to tweak per screen.
    const source = copyFromId
      ? await prisma.panel.findUnique({ where: { id: copyFromId }, include: { blocks: true } })
      : null;

    const panel = await prisma.panel.create({
      data: {
        name: name.trim(),
        ...(source && {
          logoUrl: source.logoUrl,
          showClock: source.showClock,
          showWeather: source.showWeather,
          showQuote: source.showQuote,
          quoteText: source.quoteText,
          showSustainability: source.showSustainability,
          sustainabilityImageUrl: source.sustainabilityImageUrl,
          themePrimary: source.themePrimary,
          themeDark: source.themeDark,
          fontScale: source.fontScale,
        }),
      },
    });

    const blocks = source
      ? source.blocks.map((b) => ({
          panelId: panel.id,
          key: b.key,
          order: b.order,
          enabled: b.enabled,
          title: b.title,
          text: b.text,
          date: b.date,
          typeText: b.typeText,
          imageUrl: b.imageUrl,
          videoUrl: b.videoUrl,
          startsAt: b.startsAt,
          endsAt: b.endsAt,
        }))
      : defaultBlocksFor(panel.id);

    await prisma.panelBlock.createMany({ data: blocks });

    return NextResponse.json({ ...panel, screenIds: [] }, { status: 201 });
  } catch (error: any) {
    console.error("ERROR CREATING PANEL:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    });
    return NextResponse.json({ error: "Error creant el panell" }, { status: 500 });
  }
}
