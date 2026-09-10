import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("admin1234", 10);

  await prisma.user.upsert({
    where: { email: "admin@escolaindustrial.cat" },
    update: {},
    create: {
      email: "admin@escolaindustrial.cat",
      name: "Admin",
      password: hash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "editor@escolaindustrial.cat" },
    update: {},
    create: {
      email: "editor@escolaindustrial.cat",
      name: "Editor",
      password: hash,
      role: "EDITOR",
    },
  });

  await prisma.screen.upsert({
    where: { slug: "entrada" },
    update: {},
    create: { name: "Pantalla Entrada", slug: "entrada", location: "Vestibul principal" },
  });

  await prisma.screen.upsert({
    where: { slug: "taller" },
    update: {},
    create: { name: "Pantalla Taller", slug: "taller", location: "Taller principal" },
  });

  await prisma.settings.upsert({
    where: { id: "main" },
    update: {},
    create: {},
  });

  const panel = await prisma.panel.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      name: "Panell general",
      quoteText: "Cada dia és una nova oportunitat per aprendre.",
    },
  });

  // Screens with no panel yet start on the general one.
  await prisma.screen.updateMany({ where: { panelId: null }, data: { panelId: panel.id } });

  const panelBlocks = [
    {
      key: "general",
      order: 0,
      title: "Benvinguda al nou curs escolar",
      text: "Nous projectes, activitats i espais de participació per a tota la comunitat educativa.",
      date: "Setembre 2026",
      typeText: "Centre",
    },
    {
      key: "secretaria",
      order: 1,
      title: "Actualització de dades",
      text: "Revisió de dades personals i documentació administrativa de l'alumnat.",
      date: "Fins al 30 de juliol",
      typeText: "Avís",
    },
    {
      key: "eso",
      order: 2,
      title: "Projectes interdisciplinaris",
      text: "Presentació dels treballs dels grups d'ESO als espais comuns.",
      date: "15–18 setembre",
      typeText: "Activitat",
    },
    {
      key: "batx",
      order: 3,
      title: "Orientació universitària",
      text: "Sessió sobre graus, ponderacions i itineraris formatius.",
      date: "22 de setembre",
      typeText: "Orientació",
    },
    {
      key: "fp",
      order: 4,
      title: "Jornada amb empreses",
      text: "Professionals de diferents sectors compartiran oportunitats i experiències laborals.",
      date: "25 de setembre",
      typeText: "Empresa",
    },
  ];

  for (const block of panelBlocks) {
    await prisma.panelBlock.upsert({
      where: { panelId_key: { panelId: panel.id, key: block.key } },
      update: {},
      create: { ...block, panelId: panel.id },
    });
  }

  const sustainabilityIndicators = [
    { key: "aigua", order: 0, icon: "💧", unitat: "L", valorInicial: 12500, increment: 35, dataInici: "2026-09-01", frequencia: "dia" },
    { key: "reciclatge", order: 1, icon: "♻️", unitat: "kg", valorInicial: 860, increment: 5, dataInici: "2026-09-01", frequencia: "dia" },
    { key: "energia", order: 2, icon: "⚡", unitat: "kWh", valorInicial: 4250, increment: 12, dataInici: "2026-09-01", frequencia: "dia" },
    { key: "arbres", order: 3, icon: "🌳", unitat: "arbres", valorInicial: 145, increment: 1, dataInici: "2026-09-15", frequencia: "setmana" },
    { key: "co2", order: 4, icon: "🌍", unitat: "kg CO₂", valorInicial: 320, increment: 2, dataInici: "2026-09-01", frequencia: "dia" },
  ];

  for (const indicator of sustainabilityIndicators) {
    await prisma.sustainabilityIndicator.upsert({
      where: { key: indicator.key },
      update: {},
      create: indicator,
    });
  }

  console.log("Seed completed");
}

main().catch(console.error).finally(() => prisma.$disconnect());
