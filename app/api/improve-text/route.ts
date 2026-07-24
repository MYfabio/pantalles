import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `Ets un redactor especialitzat en senyalètica digital per a un institut.
Reescriu el text que et donin perquè quedi més clar, concís i fàcil de llegir en menys de 5 segons a 3-5 metres de distància.

Regles:
- Mantén el mateix idioma que el text original (català, castellà o el que sigui).
- Màxim 40 paraules.
- Conserva la informació essencial, elimina el que sigui superflu.
- To institucional pero proper.
- Devuelve ÚNICAMENTE el text millorat, sense cometes, sense explicacions, sense markdown.`;

const MODEL_CANDIDATES = ["gemini-2.5-flash", "gemini-flash-latest"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  const { text } = await req.json();

  if (!text || !text.trim()) {
    return NextResponse.json({ error: "Falta el text" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY no configurada" }, { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: any = null;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: SYSTEM_PROMPT });
      const result = await model.generateContent(text);
      const improved = result.response.text().trim();
      return NextResponse.json({ text: improved });
    } catch (error: any) {
      lastError = error;
      const status = error?.status ?? error?.response?.status;
      console.error(`ERROR IMPROVE TEXT (model: ${modelName}):`, {
        message: error?.message,
        status,
      });
      if (status !== 404) break;
    }
  }

  console.error("ERROR IMPROVE TEXT: all model candidates failed", {
    message: lastError?.message,
    status: lastError?.status ?? lastError?.response?.status,
  });
  return NextResponse.json({ error: "Error millorant el text" }, { status: 500 });
}
