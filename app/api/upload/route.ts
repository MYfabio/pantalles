import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "BLOB_READ_WRITE_TOKEN no configurada" }, { status: 500 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Falta el fitxer" }, { status: 400 });
    }

    const blob = await put(`panel/${Date.now()}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error: any) {
    console.error("ERROR UPLOADING FILE:", {
      message: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json({ error: "Error pujant el fitxer" }, { status: 500 });
  }
}
