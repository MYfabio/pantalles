import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const content = await prisma.content.findUnique({
      where: { id: params.id },
      include: { author: true, screens: true },
    });

    if (!content) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json(content);
  } catch (error) {
    return NextResponse.json({ error: "Error obteniendo contenido" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { title, body, status, screenIds } = await req.json();

  try {
    const content = await prisma.content.update({
      where: { id: params.id },
      data: {
        title,
        body,
        status,
        updatedAt: new Date(),
        ...(screenIds !== undefined && {
          screens: {
            deleteMany: {},
            create: ((screenIds || []) as string[]).map((screenId) => ({ screenId })),
          },
        }),
      },
    });

    return NextResponse.json(content);
  } catch (error) {
    console.error("ERROR UPDATING CONTENT:", error);
    return NextResponse.json({ error: "Error actualizando contenido" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    await prisma.content.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error eliminando contenido" }, { status: 500 });
  }
}