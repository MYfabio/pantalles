# Kiosko — Escola Industrial

App per gestionar contingut a pantalles digitals.

## Panells

Un **panell** és una disposició completa de pantalla: la capçalera i els seus
blocs. Cada pantalla apunta a un panell, de manera que diverses pantalles poden
compartir-ne un o cadascuna mostrar-ne un de diferent. Es gestionen a
`Tauler → Panells`, amb selector, creació (buida o copiant l'actual) i vista
prèvia a mida real.

Cada bloc admet una **finestra de publicació** (`des de` / `fins a`): fora
d'aquestes dates desapareix sol de les pantalles, sense haver-hi de tornar.

## Rotació de continguts a les pantalles

Cada pantalla té una llista ordenada d'URLs amb els seus segons, editable a
`Tauler → Pantalles → Editar`. Pot barrejar el panell de Kiosko amb qualsevol
altra web del centre.

El dispositiu reproductor no guarda cap llista: només sap el seu slug i
consulta aquest endpoint públic, que rellegeix periòdicament.

```
GET /api/playlist/<slug>
```

```json
{
  "screen": "taller",
  "name": "Pantalla Taller",
  "active": true,
  "reloadSeconds": 300,
  "items": [
    { "label": "Panell", "url": "https://kiosko.aulaia.cat/panel/taller", "seconds": 60 },
    { "label": "Aula Sostenible", "url": "https://…", "seconds": 20 }
  ]
}
```

És públic a propòsit: els reproductors són dispositius sense ningú que hi
iniciï sessió, i només exposa adreces que ja són públiques. Si la pantalla està
desactivada retorna `active: false` i cap element; si no té llista configurada,
retorna el seu propi panell.

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

A Railway, automàtic a cada push a `main`. El `Dockerfile` aplica
`prisma migrate deploy` en arrencar el contenidor, així que les migracions no
s'han de llançar a mà.

Configuració necessària al servei de Railway:

1. **Settings → Networking → Public Networking**, amb el port `3000`. Sense això
   el servei només és accessible pel domini intern `*.railway.internal`, que no
   resol des de fora de Railway (`DNS_PROBE_FINISHED_NXDOMAIN` al navegador).
   - Domini definitiu: **`kiosko.aulaia.cat`**, afegit amb *Custom Domain*.
     Railway dóna un objectiu `*.up.railway.app` que cal posar com a registre
     `CNAME` de `kiosko` a la zona DNS d'`aulaia.cat`. El certificat TLS
     l'emet Railway automàticament un cop el DNS propaga.
   - *Generate Domain* crea un `*.up.railway.app` provisional, útil per provar
     abans de tocar el DNS.
2. **Variables**:
   - `DATABASE_URL` → referència interna de Postgres (`${{Postgres.DATABASE_URL}}`).
   - `NEXTAUTH_URL` → `https://kiosko.aulaia.cat`. Ha de coincidir exactament amb
     el domini pel qual s'hi accedeix; si apunta a `localhost` o al domini
     provisional, el login entra en bucle de redirecció.
   - `NEXTAUTH_SECRET`, `GEMINI_API_KEY`, `BLOB_READ_WRITE_TOKEN`.
3. El primer desplegament crea les taules però **no** l'usuari administrador:
   cal executar `npm run seed` un cop contra la base de dades de Railway.
