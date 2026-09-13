import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

// Newest first; the loop falls through to the next on a 404 (model not
// available to this key), the same way improve-text does.
const MODEL_CANDIDATES = ["gemini-2.5-flash-image", "gemini-2.0-flash-preview-image-generation"];

// Shapes the image model accepts. Anything else falls back to the closest.
const SUPPORTED_RATIOS = new Set(["1:1", "3:4", "4:3", "9:16", "16:9", "4:5", "5:4", "3:2", "2:3"]);

/**
 * Generates an image for a panel block and stores it.
 *
 * The prompt asks for a picture with no text in it: the block already carries
 * its title and text, and generated lettering is the one thing these models
 * still get visibly wrong on a screen read from three metres away.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  const { title, text, ratio } = await req.json();
  const subject = [title, text].filter((s) => typeof s === "string" && s.trim()).join(". ");
  if (!subject) {
    return NextResponse.json({ error: "Cal un títol o un text per generar la imatge" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY no configurada" }, { status: 500 });
  }

  const aspectRatio = SUPPORTED_RATIOS.has(ratio) ? ratio : "4:3";

  const prompt = `Create a single image for a digital signage panel in a secondary school (institut) in Catalonia.
Subject of the notice: "${subject}".
Style: bright, friendly, modern flat illustration or clean photo-like scene; warm colours; clearly readable from a distance; suitable for teenagers and teachers.
Aspect ratio ${aspectRatio}.
Strict rules: NO text, NO letters, NO numbers, NO logos, NO watermarks anywhere in the image. No people's faces in close-up.`;

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: any = null;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        // responseModalities/imageConfig are newer than this SDK's typings but
        // are passed through to the API as-is.
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
          imageConfig: { aspectRatio },
        } as any,
      });
      const result = await model.generateContent(prompt);

      const parts: any[] = result.response.candidates?.[0]?.content?.parts ?? [];
      const inline = parts.find((p) => p.inlineData?.data)?.inlineData;
      if (!inline) {
        throw Object.assign(new Error("El model no ha retornat cap imatge"), { status: 502 });
      }

      const bytes = Buffer.from(inline.data, "base64");
      const image = await prisma.storedImage.create({
        data: { mime: inline.mimeType || "image/png", bytes, size: bytes.length },
        select: { id: true },
      });

      return NextResponse.json({ url: `/api/images/${image.id}`, model: modelName });
    } catch (error: any) {
      lastError = error;
      const status = error?.status ?? error?.response?.status;
      console.error(`ERROR GENERATE IMAGE (model: ${modelName}):`, {
        message: error?.message,
        status,
      });
      if (status !== 404) break;
    }
  }

  console.error("ERROR GENERATE IMAGE: all model candidates failed", {
    message: lastError?.message,
  });
  return NextResponse.json(
    { error: lastError?.message || "Error generant la imatge" },
    { status: 500 }
  );
}
