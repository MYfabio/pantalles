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
      where: { key: block.key },
      update: {},
      create: block,
    });
  }

  console.log("Seed completed");
}

main().catch(console.error).finally(() => prisma.$disconnect());
