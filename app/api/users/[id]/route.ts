import { NextRequest, NextResponse } from "next/server";
import { dominiDe, enviarAvis, rolComu } from "@/lib/avisos";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import bcrypt from "bcryptjs";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
  updatedAt: true,
};

const ROLS = ["ADMIN", "EDITOR"];

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: userSelect,
    });
    if (!user) {
      return NextResponse.json({ error: "No trobat" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Error obtenint usuari" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { name, email, password, role, active } = await req.json();
  if (role !== undefined && !ROLS.includes(role)) {
    return NextResponse.json({ error: "Rol no vàlid" }, { status: 400 });
  }
  // Un admin no es pot treure el rol ni desactivar-se: es quedaria el centre sense ningú que gestioni.
  if (params.id === admin.id && ((role !== undefined && role !== "ADMIN") || active === false)) {
    return NextResponse.json({ error: "No et pots treure el rol d'administrador ni desactivar-te" }, { status: 400 });
  }

  try {
    const abans = await prisma.user.findUnique({ where: { id: params.id }, select: { email: true, role: true, active: true } });
    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        name,
        email,
        role,
        active,
        updatedAt: new Date(),
        ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
      },
      select: userSelect,
    });
    if (abans) {
      const centre = dominiDe(user.email);
      if (rolComu(abans.role) !== rolComu(user.role)) void enviarAvis({ tipus: "rol.canvi", centre, datos: { abans: rolComu(abans.role), ara: rolComu(user.role) } });
      if (abans.active && !user.active) void enviarAvis({ tipus: "baixa", centre, datos: { rol: rolComu(user.role) } });
      if (!abans.active && user.active) void enviarAvis({ tipus: "alta.validada", centre, datos: { rol: rolComu(user.role) } });
    }
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Error actualitzant usuari" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  if (params.id === admin.id) {
    return NextResponse.json({ error: "No et pots eliminar a tu mateix" }, { status: 400 });
  }

  try {
    const esborrat = await prisma.user.delete({ where: { id: params.id }, select: { email: true, role: true } });
    void enviarAvis({ tipus: "baixa", centre: dominiDe(esborrat.email), datos: { rol: rolComu(esborrat.role) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error eliminant usuari" }, { status: 500 });
  }
}
