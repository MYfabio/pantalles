import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  try {
    const [settings, panel] = await Promise.all([
      prisma.settings.upsert({ where: { id: "main" }, update: {}, create: {} }),
      prisma.panelSettings.upsert({ where: { id: "main" }, update: {}, create: {} }),
    ]);
    return NextResponse.json({ ...settings, panel });
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

    let panelSettings = await prisma.panelSettings.upsert({
      where: { id: "main" },
      update: {},
      create: {},
    });

    if (panel) {
      const { logoUrl: panelLogoUrl, showClock, showWeather, showQuote, quoteText } = panel;
      panelSettings = await prisma.panelSettings.update({
        where: { id: "main" },
        data: { logoUrl: panelLogoUrl, showClock, showWeather, showQuote, quoteText },
      });
    }

    return NextResponse.json({ ...settings, panel: panelSettings });
  } catch (error) {
    console.error("ERROR UPDATING SETTINGS:", error);
    return NextResponse.json({ error: "Error actualitzant la configuracio" }, { status: 500 });
  }
}
