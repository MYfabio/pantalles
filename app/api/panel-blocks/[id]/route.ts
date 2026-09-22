import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// The editor sends plain YYYY-MM-DD. A start date means "from that day on" and
// an end date means "up to and including that day", so they expand to opposite
// ends of the day.
function toBoundary(value: unknown, edge: "start" | "end") {
  if (!value || typeof value !== "string") return null;
  const suffix = edge === "start" ? "T00:00:00.000Z" : "T23:59:59.999Z";
  const date = new Date(value.length === 10 ? `${value}${suffix}` : value);
  return isNaN(date.getTime()) ? null : date;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  const { enabled, title, text, date, typeText, imageUrl, videoUrl, startsAt, endsAt } =
    await req.json();

  try {
    const block = await prisma.panelBlock.update({
      where: { id: params.id },
      data: {
        enabled,
        title,
        text,
        date,
        typeText,
        imageUrl,
        ...(videoUrl !== undefined && { videoUrl: videoUrl || null }),
        // An empty date input means "no limit".
        ...(startsAt !== undefined && { startsAt: toBoundary(startsAt, "start") }),
        ...(endsAt !== undefined && { endsAt: toBoundary(endsAt, "end") }),
      },
    });
    return NextResponse.json(block);
  } catch (error: any) {
    console.error("ERROR UPDATING PANEL BLOCK:", {
      blockId: params.id,
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });
    return NextResponse.json({ error: "Error actualitzant el bloc" }, { status: 500 });
  }
}
