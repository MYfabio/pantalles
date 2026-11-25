import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildPosterPrompt, POSTER_RATIO } from "@/lib/poster-prompt";
import { isHexColor } from "@/lib/panel-theme";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Newest first; the loop falls through to the next on a 404 (model not
// available to this key).
const MODEL_CANDIDATES = ["gemini-2.5-flash-image", "gemini-2.0-flash-preview-image-generation"];

// Generar una imatge triga uns 10-20 s; més de 50 vol dir que s'ha encallat.
const TIMEOUT_MS = 50_000;

/**
 * Crea el cartel d'una pantalla amb Gemini a partir del que la persona vol
 * comunicar, i el desa. El text del cartel va en català (lib/poster-prompt.ts).
 *
 * Si falla, l'editor sempre deixa pujar la imatge a mà: la IA és una drecera,
 * no l'única via.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  const { description, primary, dark } = await req.json();
  if (typeof description !== "string" || !description.trim()) {
    return NextResponse.json({ error: "Escriu què vols que surti al cartell" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "La IA no està configurada. Puja la imatge a mà." }, { status: 500 });
  }

  const prompt = buildPosterPrompt({
    description,
    primary: isHexColor(primary) ? primary : "#a00842",
    dark: isHexColor(dark) ? dark : "#7a1230",
  });

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
          imageConfig: { aspectRatio: POSTER_RATIO },
        } as any,
      });
      const result = await model.generateContent(prompt, { timeout: TIMEOUT_MS });

      const parts: any[] = result.response.candidates?.[0]?.content?.parts ?? [];
      const inline = parts.find((p) => p.inlineData?.data)?.inlineData;
      if (!inline) {
        throw Object.assign(new Error("Gemini no ha retornat cap imatge"), { status: 502 });
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

  const status = lastError?.status ?? lastError?.response?.status;
  const message =
    status === 429
      ? "S'ha acabat la quota de Gemini per avui. Torna-ho a provar demà o puja la imatge a mà."
      : status === 502
      ? "Gemini no ha fet cap imatge amb aquesta descripció. Prova de dir-ho d'una altra manera."
      : /timeout|abort/i.test(String(lastError?.message))
      ? "Gemini ha trigat massa. Torna-ho a provar d'aquí a una estona."
      : "No s'ha pogut generar la imatge. Torna-ho a provar o puja-la a mà.";
  return NextResponse.json({ error: message }, { status: status === 429 ? 429 : 500 });
}
