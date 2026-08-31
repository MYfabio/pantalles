# Prompt de arranque — Pantalles (Pantallas_web)

Pegar al abrir una sesión nueva de Claude Code.

---

Proyecto **Pantalles — Escola Industrial** en
`C:\Users\super\Desktop\APPS\Pantallas_web` — repo `MYfabio/pantalles`.

**Estado: pendiente de desplegar.** Todavía no está publicado en Railway; el
despliegue previsto es automático a cada push a `main` (hay `Dockerfile`).
Trátalo como preproducción: no hay datos reales que preservar.

**Qué es:** gestor de contenido para las pantallas digitales del centro. Se
crean pantallas, se les asigna contenido y se proyectan a pantalla completa;
incluye un editor de paneles por bloques ordenables y un módulo de indicadores
de sostenibilidad. Interfaz en catalán.

**Stack:** Next.js 14 App Router + TypeScript + Tailwind 3 · PostgreSQL con
Prisma 5 · NextAuth 4 con credenciales (bcrypt) · Gemini
(`@google/generative-ai`) para generar y mejorar textos · Vercel Blob para
subidas · dnd-kit para reordenar bloques.

**Estructura:**
```
app/dashboard/   panel de gestión: screens, contents, panel, users, settings, help
app/display/[slug]   vista de proyección de una pantalla
app/panel/[slug]     panel a pantalla completa
app/api/         auth · screens · contents · panel-blocks · sustainability ·
                 generate-content · improve-text · upload · users · settings
components/      PanelDisplay, PanelFullscreenFrame, GeneratedScreenFrame,
                 Sidebar, panel/SortableBlockEditor,
                 panel/SustainabilityModuleEditor
lib/             auth.ts (NextAuth), prisma.ts
prisma/          schema.prisma, migrations/0_init, seed.ts
```

**Comandos:**
```
npm install
cp .env.example .env.local
npx prisma migrate dev
npm run seed        # tsx prisma/seed.ts
npm run dev         # localhost:3000
npm run build       # prisma generate && next build
```

**Entorno:** `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`,
`GEMINI_API_KEY`, `BLOB_READ_WRITE_TOKEN`.

**Antes de desplegar, obligatorio:**
- Sacar el token de acceso de GitHub que está incrustado en la URL del remoto
  (`git remote -v`) y revocarlo: `git remote set-url origin
  https://github.com/MYfabio/pantalles.git`.
- Cambiar las credenciales de administrador y quitarlas del `README.md`. El
  seed no debe dejar una contraseña por defecto en un entorno publicado.
- `NEXTAUTH_SECRET` real y `NEXTAUTH_URL` con el dominio definitivo.
- Comprobar que `/display/[slug]` y `/panel/[slug]` no exponen nada privado: son
  las rutas que se ven proyectadas en el pasillo.

**Reglas:**
- La clave de Gemini solo en el servidor, nunca en cliente ni en el repo.
- Cambios de esquema siempre con migración de Prisma.
- Las subidas van a Vercel Blob; no guardes binarios en el repositorio.

**Cómo quiero que trabajes:**
1. Trabaja de forma autónoma, sin pedirme permiso paso a paso; ejecuta y resume.
2. Mensajes de commit cortos y descriptivos, como los que ya hay.
3. Responde breve, en catalán o castellano.
