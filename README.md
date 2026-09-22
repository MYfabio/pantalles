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

## Editor de panells

L'editor (`/dashboard/panel`) té quatre mòduls plegables a l'esquerra (Capçalera,
Aparença, Blocs, Pantalles) i la previsualització fixa a la dreta. Dels blocs
només s'obre el que s'edita; la resta es veuen com una línia amb el títol, el
tipus, les dates de publicació i el mitjà. La barra de dalt diu si hi ha canvis
sense desar, i «Duplica» crea un panell nou a partir de l'actual.

## Aparença per panell

Cada panell pot tenir el seu color de capçalera i de peu i una mida de lletra
(`Panel.themePrimary`, `themeDark`, `fontScale`; `lib/panel-theme.ts`). Sense
res desat, hereta el granat del centre: els panells que ja existien no canvien.
Hi ha sis combinacions preparades amb contrast comprovat i un color propi; si
el text blanc no arribaria al contrast mínim, l'editor avisa. Els colors de
cada bloc (General, Secretaria, ESO…) no canvien mai: diuen el tipus d'avís.

## Vídeo als blocs

Un bloc pot portar un vídeo curt en lloc d'una imatge (`PanelBlock.videoUrl`):
MP4 o WebM, màxim 30 segons i 15 MB (`lib/media-limits.ts`). L'editor en llegeix
la durada i en treu un fotograma abans de pujar-lo; el fotograma es guarda com
a `imageUrl` i fa de reserva a les pantalles que no puguin reproduir-lo. A la
pantalla es reprodueix sense so i en bucle. Es guarda a la mateixa taula que
les imatges i es serveix per `/api/media/<id>`, que admet la capçalera `Range`
(els reproductors Android no arrenquen sense un 206).

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

Variables: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GEMINI_API_KEY`.

Les imatges (pujades i generades amb IA) es guarden a la mateixa base de dades
i se serveixen des de `/api/images/<id>`: no cal cap servei de fitxers extern.

## Desplegament

A Railway, automàtic a cada push a `main`. El `Dockerfile` aplica
`prisma migrate deploy` en arrencar el contenidor, així que les migracions no
s'han de llançar a mà.

Configuració necessària al servei de Railway:

1. **Settings → Networking → Public Networking**, amb el port `3000`. Sense això
   el servei només és accessible pel domini intern `*.railway.internal`, que no
   resol des de fora de Railway (`DNS_PROBE_FINISHED_NXDOMAIN` al navegador).
   - Domini: **`kiosko.aulaia.cat`**, afegit amb *Custom Domain*. La zona DNS
     d'`aulaia.cat` **no és a cdmon** (on només hi ha el domini registrat):
     està delegada a **Cloudflare**, que és on cal crear els registres. El
     `CNAME` ha d'anar en mode **DNS only** (núvol gris); amb el proxy activat
     Railway no pot verificar el domini ni emetre el certificat.
   - *Generate Domain* crea un `*.up.railway.app` provisional, útil per provar
     abans de tocar el DNS.
2. **Variables**:
   - `DATABASE_URL` → referència interna de Postgres (`${{Postgres.DATABASE_URL}}`).
   - `NEXTAUTH_URL` → `https://kiosko.aulaia.cat`. Ha de coincidir exactament amb
     el domini pel qual s'hi accedeix; si apunta a `localhost` o al domini
     provisional, el login entra en bucle de redirecció.
   - `NEXTAUTH_SECRET`, `GEMINI_API_KEY`.
3. El primer desplegament crea les taules però **no** l'usuari administrador:
   cal executar `npm run seed` un cop contra la base de dades de Railway.
