import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface UsuariActual {
  id: string;
  role: string;
}

/**
 * Usuari de la sessió, rellegit de la base de dades: el JWT de NextAuth dura
 * dies, i així un compte desactivat o un canvi de rol s'apliquen a l'acte.
 */
export async function usuariActual(): Promise<UsuariActual | null> {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  const email = session?.user?.email;
  if (!id && !email) return null;
  const user = await prisma.user.findFirst({
    where: id ? { id } : { email: email! },
    select: { id: true, role: true, active: true },
  });
  if (!user || !user.active) return null;
  return { id: user.id, role: user.role };
}

/** Retorna l'usuari si és ADMIN, o la resposta d'error que cal tornar. */
export async function requireAdmin(): Promise<UsuariActual | NextResponse> {
  const u = await usuariActual();
  if (!u) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  if (u.role !== "ADMIN") return NextResponse.json({ error: "Només per a administradors" }, { status: 403 });
  return u;
}
