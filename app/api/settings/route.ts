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
    const settings = await prisma.settings.upsert({
      where: { id: "main" },
      update: {},
      create: {},
    });
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Error obtenint la configuracio" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  const { schoolName, primaryColor, secondaryColor, accentColor, logoUrl } = await req.json();

  try {
    const settings = await prisma.settings.upsert({
      where: { id: "main" },
      update: { schoolName, primaryColor, secondaryColor, accentColor, logoUrl },
      create: { id: "main", schoolName, primaryColor, secondaryColor, accentColor, logoUrl },
    });
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Error actualitzant la configuracio" }, { status: 500 });
  }
}
