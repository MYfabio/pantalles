import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { title, body, status, screenIds } = await req.json();
  try {
    const content = await prisma.content.create({
      data: {
        title,
        body,
        status,
        authorId: (session.user as any).id,
        screens: {
          connect: screenIds.map((id: string) => ({ id })),
        },
      },
    });
    return NextResponse.json(content);
  } catch (error) {
    return NextResponse.json({ error: "Error creando contenido" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const contents = await prisma.content.findMany({
      include: { author: true, screens: true },
    });
    return NextResponse.json(contents);
  } catch (error) {
    return NextResponse.json({ error: "Error obteniendo contenidos" }, { status: 500 });
  }
}