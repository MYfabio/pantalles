import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const authorId = (session.user as any)?.id;
  if (!authorId) {
    return NextResponse.json(
      { error: "Sessió invàlida, torna a iniciar sessió" },
      { status: 401 }
    );
  }

  const { title, body, status, screenIds, department, generatedHtml } = await req.json();
  try {
    const content = await prisma.content.create({
      data: {
        title,
        body,
        status,
        department,
        generatedHtml,
        authorId,
        screens: {
          create: ((screenIds || []) as string[]).map((screenId) => ({ screenId })),
        },
      },
    });
    return NextResponse.json(content);
  } catch (error: any) {
    console.error("ERROR CREATING CONTENT:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });
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
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(contents);
  } catch (error) {
    console.error("ERROR CONTENTS:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
