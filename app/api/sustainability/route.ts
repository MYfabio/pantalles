import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  try {
    const indicators = await prisma.sustainabilityIndicator.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json(indicators, {
      headers: { "Cache-Control": "no-store, must-revalidate" },
    });
  } catch (error) {
    console.error("ERROR SUSTAINABILITY INDICATORS:", error);
    return NextResponse.json({ error: "Error obtenint els indicadors" }, { status: 500 });
  }
}
