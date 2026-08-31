# Pantalles — Escola Industrial

App per gestionar contingut a pantalles digitals.

Context complet per treballar-hi: [`docs/PROMPT-INICIO.md`](docs/PROMPT-INICIO.md).

## Accés

L'usuari administrador es crea amb el seed (`npm run seed`). La contrasenya
**no** es documenta aquí: es defineix per variable d'entorn a cada entorn i es
canvia abans de qualsevol desplegament públic.

## Posada en marxa

```bash
npm install
cp .env.example .env.local
npx prisma migrate dev
npm run seed
npm run dev
```

Variables: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GEMINI_API_KEY`,
`BLOB_READ_WRITE_TOKEN`.

## Desplegament

Pendent. Previst a Railway, automàtic a cada push a `main`.
