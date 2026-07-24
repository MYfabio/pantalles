import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function toPanelJson(panel: { screens: { screenId: string }[] } & Record<string, any>) {
  const { screens, ...rest } = panel;
  return { ...rest, screenIds: screens.map((s) => s.screenId) };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  try {
    const [settings, panel] = await Promise.all([
      prisma.settings.upsert({ where: { id: "main" }, update: {}, create: {} }),
      prisma.panelSettings.upsert({
        where: { id: "main" },
        update: {},
        create: {},
        include: { screens: true },
      }),
    ]);
    return NextResponse.json(
      { ...settings, panel: toPanelJson(panel) },
      { headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
  } catch (error) {
    console.error("ERROR SETTINGS:", error);
    return NextResponse.json({ error: "Error obtenint la configuracio" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  const { schoolName, primaryColor, secondaryColor, accentColor, logoUrl, panel } = await req.json();

  try {
    const settings = await prisma.settings.upsert({
      where: { id: "main" },
      update: { schoolName, primaryColor, secondaryColor, accentColor, logoUrl },
      create: { id: "main", schoolName, primaryColor, secondaryColor, accentColor, logoUrl },
    });

    await prisma.panelSettings.upsert({ where: { id: "main" }, update: {}, create: {} });

    let panelSettings;
    if (panel) {
      const { logoUrl: panelLogoUrl, showClock, showWeather, showQuote, quoteText, screenIds } = panel;
      panelSettings = await prisma.panelSettings.update({
        where: { id: "main" },
        data: {
          logoUrl: panelLogoUrl,
          showClock,
          showWeather,
          showQuote,
          quoteText,
          ...(screenIds !== undefined && {
            screens: {
              deleteMany: {},
              create: ((screenIds || []) as string[]).map((screenId) => ({ screenId })),
            },
          }),
        },
        include: { screens: true },
      });
    } else {
      panelSettings = await prisma.panelSettings.findUniqueOrThrow({
        where: { id: "main" },
        include: { screens: true },
      });
    }

    return NextResponse.json({ ...settings, panel: toPanelJson(panelSettings) });
  } catch (error: any) {
    console.error("ERROR UPDATING SETTINGS:", {
      body: { schoolName, primaryColor, secondaryColor, accentColor, logoUrl, panel },
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });
    return NextResponse.json({ error: "Error actualitzant la configuracio" }, { status: 500 });
  }
}
