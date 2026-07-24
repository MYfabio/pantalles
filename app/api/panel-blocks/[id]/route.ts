import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  const { enabled, title, text, date, typeText } = await req.json();

  try {
    const block = await prisma.panelBlock.update({
      where: { id: params.id },
      data: { enabled, title, text, date, typeText },
    });
    return NextResponse.json(block);
  } catch (error) {
    console.error("ERROR UPDATING PANEL BLOCK:", error);
    return NextResponse.json({ error: "Error actualitzant el bloc" }, { status: 500 });
  }
}
