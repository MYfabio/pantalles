import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const DEPARTMENTS = ["SECRETARIA", "ESO_BATXILLERAT", "FP", "GENERAL"] as const;
type Department = (typeof DEPARTMENTS)[number];

const DEPARTMENT_GUIDANCE: Record<Department, string> = {
  SECRETARIA:
    "Departament: SECRETARIA. Disseny formal, prioritza dates i terminis, icones de calendari/documents/administracio, distribucio estructurada.",
  ESO_BATXILLERAT:
    "Departament: ESO_BATXILLERAT. Disseny dinamic, mes elements grafics, icones d'educacio/activitats/premis, aspecte proper i modern.",
  FP:
    "Departament: FP. Disseny tecnologic i industrial, patrons geometrics de tallers/enginyeria, icones d'innovacio/empresa/equipament tecnic.",
  GENERAL:
    "Departament: GENERAL. Disseny corporatiu equilibrat, per a noticies/reconeixements/esdeveniments/anuncis generals.",
};

const SYSTEM_PROMPT = `PROMPT MAESTRO – PANTALLAS VERTICALES INSTITUT ESCOLA INDUSTRIAL DE SABADELL

Actúa como diseñador senior especializado en señalética digital y comunicación institucional.
Diseña una pantalla digital vertical (1080x1920) para el Institut Escola Industrial de Sabadell siguiendo estrictamente la identidad visual del centro.

Identidad corporativa obligatoria
- Color principal: #a00842
- Color secundario: #d9d9d9
- Fondo principal: blanco
- Tipografía: Arial o Helvetica
- Diseño minimalista, moderno, elegante e institucional
- Bordes redondeados (6-8px)
- Utilizar exclusivamente un máximo de tres colores simultáneamente

Restricciones
- NO utilizar fotografías, personas ni imágenes realistas
- NO utilizar fondos recargados
- NO utilizar más de 40 palabras por bloque de texto
- El contenido debe comprenderse en menos de 5 segundos
- Resumir automáticamente los textos largos conservando solo la información esencial

Recursos visuales permitidos
- Formas geométricas, líneas y patrones inspirados en la arquitectura industrial
- Iconos minimalistas (usa SVG inline simples, sin librerías externas)
- Cajas destacadas, separadores discretos, elementos gráficos vectoriales, sombras suaves

Distribución de la pantalla
1. Cabecera: nombre del centro, barra superior en color #a00842
2. Título principal: tamaño grande, máximo dos líneas
3. Contenido: presentado en bloques o tarjetas, máximo tres bloques
4. Fecha o periodo: destacado en cápsula gris (#d9d9d9)
5. Pie de pantalla: texto discreto "Institut Escola Industrial de Sabadell"

Según el departamento indicado, aplica:
- SECRETARIA: diseño formal, prioriza fechas y plazos, iconos de calendario/documentos/administración, distribución estructurada
- ESO_BATXILLERAT: diseño dinámico, más elementos gráficos, iconos de educación/actividades/premios, aspecto cercano y moderno
- FP: diseño tecnológico e industrial, patrones geométricos de talleres/ingeniería, iconos de innovación/empresa/equipamiento técnico
- GENERAL: diseño corporativo equilibrado, para noticias/reconocimientos/eventos/anuncios generales

Reglas finales
- Priorizar legibilidad a 3-5 metros de distancia
- Mantener amplios espacios en blanco
- Generar una única pantalla vertical (1080x1920px)
- Si el texto es excesivo, resumirlo

Formato de salida obligatorio
- El resultado NO es una propuesta visual en texto: es el producto final.
- Devuelve un único bloque HTML autocontenido con el CSS embebido dentro de una etiqueta <style>, pensado para insertarse tal cual dentro de un <div> o <iframe> y renderizarse directamente en pantalla.
- El elemento raíz debe tener un tamaño fijo de 1080x1920px (usa esas dimensiones exactas en el CSS, con overflow: hidden), listo para ocupar la pantalla vertical completa sin scroll.
- No incluyas <html>, <head> ni <body>: solo el fragmento (div raíz + <style>) que se insertará directamente en el DOM.
- No uses librerías externas, fuentes web, ni recursos remotos: todo el CSS y los SVG deben ir embebidos inline.
- Devuelve ÚNICAMENTE el código HTML completo con CSS embebido en <style>, sin explicaciones, sin markdown, sin backticks, listo para insertar directamente en el DOM.`;

function cleanHtml(raw: string): string {
  let html = raw.trim();
  html = html.replace(/^```(?:html)?\s*/i, "");
  html = html.replace(/```\s*$/i, "");
  return html.trim();
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  const { department, content } = await req.json();

  if (!content || !department || !DEPARTMENTS.includes(department)) {
    return NextResponse.json({ error: "Falten camps obligatoris" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY no configurada" }, { status: 500 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const userPrompt = `${DEPARTMENT_GUIDANCE[department as Department]}\n\nContingut a mostrar:\n${content}`;

    const result = await model.generateContent(userPrompt);
    const html = cleanHtml(result.response.text());

    return NextResponse.json({ html });
  } catch (error) {
    console.error("ERROR GENERATE CONTENT:", error);
    return NextResponse.json({ error: "Error generant el contingut" }, { status: 500 });
  }
}
