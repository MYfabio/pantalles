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

  console.log("Seed completed");
}

main().catch(console.error).finally(() => prisma.$disconnect());
