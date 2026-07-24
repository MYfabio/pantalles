import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  try {
    const screens = await prisma.screen.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(screens);
  } catch (error) {
    return NextResponse.json({ error: "Error obtenint pantalles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  const { name, slug, location } = await req.json();

  try {
    const screen = await prisma.screen.create({
      data: { name, slug, location, active: true },
    });
    return NextResponse.json(screen);
  } catch (error) {
    return NextResponse.json({ error: "Error creant pantalla" }, { status: 500 });
  }
}