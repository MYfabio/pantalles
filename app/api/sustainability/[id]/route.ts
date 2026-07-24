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

  const { enabled, icon, unitat, valorInicial, increment, dataInici, frequencia } = await req.json();

  try {
    const indicator = await prisma.sustainabilityIndicator.update({
      where: { id: params.id },
      data: {
        enabled,
        icon,
        unitat,
        valorInicial: valorInicial !== undefined ? Number(valorInicial) : undefined,
        increment: increment !== undefined ? Number(increment) : undefined,
        dataInici,
        frequencia,
      },
    });
    return NextResponse.json(indicator);
  } catch (error: any) {
    console.error("ERROR UPDATING SUSTAINABILITY INDICATOR:", {
      indicatorId: params.id,
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });
    return NextResponse.json({ error: "Error actualitzant l'indicador" }, { status: 500 });
  }
}
