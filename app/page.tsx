import Link from "next/link";
import KioskoLogo, { KioskoMark } from "@/components/KioskoLogo";
import {
  MonitorIllustration,
  UsbIllustration,
  AndroidBoxIllustration,
  StepBadge,
} from "@/components/landing/Illustrations";
import { ALTA_FORM_URL, ANDROID_APK_URL } from "@/lib/landing-config";

export const metadata = {
  title: "Kiosko escolar — Cartelleria digital per a centres educatius",
  description:
    "Gestiona el que es veu a les pantalles del centre des del navegador: avisos de secretaria, activitats dels departaments i projectes de centre. Alta gratuïta per a escoles.",
};

const NAVY = "#1a3a5c";
const ACCENT = "#a00842";

const PUBLICS = [
  {
    icon: "📄",
    title: "Secretaria",
    text: "Terminis de matrícula, documentació pendent, canvis d'horari. Publica l'avís amb data de caducitat i desapareix sol quan toca.",
  },
  {
    icon: "📚",
    title: "Departaments",
    text: "Cada departament prepara les seves activitats, sortides i sessions d'orientació sense demanar-ho a ningú ni esperar torn.",
  },
  {
    icon: "🏫",
    title: "Projectes de centre",
    text: "Lligues escolars, projectes de sostenibilitat, intercanvis, premis. El que fa el centre es veu al centre, cada dia.",
  },
  {
    icon: "🧭",
    title: "Direcció",
    text: "Una mirada al tauler i saps què mostra cada pantalla i quan es va actualitzar per darrera vegada.",
  },
];

const FEATURES = [
  {
    title: "Un panell per pantalla",
    text: "El vestíbul, el taller i la sala de professorat poden mostrar coses diferents, o compartir el mateix panell. Ho decideixes amb una casella.",
  },
  {
    title: "Publicació automàtica",
    text: "Posa una data d'inici i una de fi a cada bloc. Prepares la setmana el dilluns i el contingut apareix i caduca tot sol.",
  },
  {
    title: "Rotació de continguts",
    text: "Alterna el panell del centre amb qualsevol altra web: Aula Sostenible, Kikup, la lliga escolar. Els temps es canvien des del navegador.",
  },
  {
    title: "Redacció assistida",
    text: "Un botó reescriu el text perquè es llegeixi de lluny. Amb comptador de caràcters, perquè ningú publiqui un paràgraf en una pantalla.",
  },
  {
    title: "Indicadors de sostenibilitat",
    text: "Comptadors d'aigua, reciclatge, energia, arbres i CO₂ que creixen sols a la capçalera i donen visibilitat al projecte ambiental.",
  },
  {
    title: "Vista prèvia real",
    text: "Comprova com queda a mida completa abans de publicar, sense baixar al vestíbul a mirar la pantalla.",
  },
];

const INSTALL_STEPS = [
  {
    title: "Descarrega l'aplicació a l'ordinador",
    text: "Baixa el fitxer d'instal·lació de Kiosko (un fitxer .apk) des d'aquesta pàgina.",
  },
  {
    title: "Copia'l a un llapis USB",
    text: "Arrossega el fitxer .apk a l'arrel del llapis. No cal res més al USB.",
  },
  {
    title: "Connecta el USB a la pantalla",
    text: "Al port USB del monitor amb Android, o al del reproductor connectat per HDMI.",
  },
  {
    title: "Permet la instal·lació",
    text: "Obre el gestor de fitxers de la pantalla i toca el fitxer. Android demanarà permís per instal·lar d'orígens desconeguts: accepta-ho. És normal, i només cal fer-ho un cop.",
  },
  {
    title: "Enganxa l'adreça de la pantalla",
    text: "En obrir Kiosko per primer cop demana una única dada: l'adreça de la pantalla, que trobaràs al gestor a Pantalles → Editar.",
  },
  {
    title: "Activa l'inici automàtic",
    text: "Marca l'opció perquè Kiosko s'obri sol en engegar. A partir d'aquí la pantalla funciona sola: si hi ha una tallada de llum, torna a arrencar.",
  },
];

export default function LandingPage() {
  const apkReady = Boolean(ANDROID_APK_URL);

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* ---------- Capçalera ---------- */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div style={{ color: NAVY }}>
            <KioskoLogo size={34} subtitle="Cartelleria escolar" />
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#installacio"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block"
            >
              Instal·lació
            </a>
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Accés al gestor
            </Link>
          </div>
        </div>
      </header>

      {/* ---------- Portada ---------- */}
      <section className="px-5 py-16 sm:py-24" style={{ background: NAVY }}>
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div className="text-white">
            <p
              className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
              style={{ background: ACCENT }}
            >
              Gratuït per a centres educatius
            </p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Les pantalles del centre,
              <br />
              gestionades des del navegador
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/80">
              Kiosko converteix qualsevol monitor en un tauler d&apos;anuncis digital. Secretaria,
              departaments i equip directiu publiquen el que cal i les pantalles s&apos;actualitzen
              soles, sense que ningú s&apos;hi hagi d&apos;acostar amb un llapis de memòria.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={ALTA_FORM_URL}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-90"
                style={{ background: ACCENT }}
              >
                Alta gratuïta per a la teva escola
              </a>
              <a
                href="#installacio"
                className="rounded-lg border border-white/40 px-6 py-3 text-base font-semibold text-white hover:bg-white/10"
              >
                Com es munta
              </a>
            </div>
          </div>
          <div className="flex justify-center">
            <MonitorIllustration className="h-80 w-auto drop-shadow-2xl sm:h-96" />
          </div>
        </div>
      </section>

      {/* ---------- Per a qui ---------- */}
      <section className="px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold" style={{ color: NAVY }}>
            Qui el fa servir, i per a què
          </h2>
          <p className="mt-3 max-w-3xl text-lg text-slate-600">
            El problema de les pantalles d&apos;un centre no és tècnic: és que acaben ensenyant el
            mateix cartell durant tres setmanes perquè actualitzar-les costa massa. Kiosko fa que
            publicar sigui qüestió d&apos;un minut, des de qualsevol ordinador del centre.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {PUBLICS.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-slate-200 p-6 transition hover:shadow-md"
              >
                <div className="text-3xl">{p.icon}</div>
                <h3 className="mt-3 text-lg font-bold" style={{ color: ACCENT }}>
                  {p.title}
                </h3>
                <p className="mt-2 text-slate-600">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Funcionalitats ---------- */}
      <section className="bg-slate-50 px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold" style={{ color: NAVY }}>
            Què sap fer
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold" style={{ color: NAVY }}>
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Com funciona ---------- */}
      <section className="px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold" style={{ color: NAVY }}>
            Com funciona
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              {
                n: 1,
                t: "Escrius al gestor",
                d: "Entres amb el teu usuari del centre i edites els blocs del panell: títol, text, imatge i dates.",
              },
              {
                n: 2,
                t: "Assignes pantalles",
                d: "Tries a quines pantalles va cada panell. Poden compartir-lo o mostrar cadascuna la seva.",
              },
              {
                n: 3,
                t: "Les pantalles s'actualitzen soles",
                d: "El reproductor consulta el servidor cada pocs minuts. No cal tornar-hi mai.",
              },
            ].map((s) => (
              <div key={s.n} className="flex gap-4">
                <StepBadge n={s.n} />
                <div>
                  <h3 className="text-lg font-bold" style={{ color: NAVY }}>
                    {s.t}
                  </h3>
                  <p className="mt-1 text-slate-600">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Instal·lació ---------- */}
      {/* scroll-mt keeps the heading clear of the sticky header on the anchor jump */}
      <section id="installacio" className="scroll-mt-20 bg-slate-50 px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold" style={{ color: NAVY }}>
            Instal·lar Kiosko en un monitor
          </h2>
          <p className="mt-3 max-w-3xl text-lg text-slate-600">
            No cal comprar res especial. Serveix qualsevol monitor o televisor amb Android, i si el
            que tens no en porta, un reproductor Android de vint euros connectat per HDMI ja fa la
            feina.
          </p>

          {/* Què necessites */}
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              {
                Illo: MonitorIllustration,
                t: "Un monitor",
                d: "Millor en vertical, que és com estan pensats els panells. També funciona en horitzontal.",
                tall: true,
              },
              {
                Illo: AndroidBoxIllustration,
                t: "Android",
                d: "Integrat al monitor o en un reproductor connectat per HDMI. Android 8.0 o superior.",
              },
              {
                Illo: UsbIllustration,
                t: "Un llapis USB",
                d: "Per portar l'aplicació fins a la pantalla si aquesta no té navegador ni botiga d'apps.",
              },
            ].map(({ Illo, t, d, tall }) => (
              <div
                key={t}
                className="flex flex-col items-center rounded-2xl bg-white p-6 text-center shadow-sm"
              >
                <Illo className={tall ? "h-32 w-auto" : "h-20 w-auto"} />
                <h3 className="mt-4 text-base font-bold" style={{ color: NAVY }}>
                  {t}
                </h3>
                <p className="mt-1 text-sm text-slate-600">{d}</p>
              </div>
            ))}
          </div>

          {/* Passos */}
          <div className="mt-12 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <h3 className="text-xl font-bold" style={{ color: NAVY }}>
              Pas a pas, amb un llapis USB
            </h3>
            <ol className="mt-6 space-y-6">
              {INSTALL_STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <StepBadge n={i + 1} />
                  <div className="pt-1">
                    <h4 className="font-bold text-slate-900">{s.title}</h4>
                    <p className="mt-1 text-slate-600">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div
              className="mt-8 rounded-xl border-l-4 p-4 text-sm"
              style={{ borderColor: ACCENT, background: "#fff5f8" }}
            >
              <strong className="text-slate-900">Si la pantalla té navegador i xarxa</strong>, pots
              saltar-te el USB: obre l&apos;adreça de descàrrega directament a la pantalla i
              instal·la des d&apos;allà.
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Descàrrega ---------- */}
      <section className="px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl rounded-3xl p-8 text-center sm:p-12" style={{ background: NAVY }}>
          <div className="flex justify-center text-white">
            <KioskoMark size={56} accent="#e8467f" />
          </div>
          <h2 className="mt-5 text-3xl font-bold text-white">Kiosko per a Android</h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/80">
            L&apos;aplicació que va a la pantalla. Només necessita l&apos;adreça del panell: la
            resta —què mostrar, quant de temps i en quin ordre— es gestiona des del navegador.
          </p>

          {apkReady ? (
            <a
              href={ANDROID_APK_URL}
              className="mt-8 inline-block rounded-lg px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:opacity-90"
              style={{ background: ACCENT }}
            >
              ⬇ Descarregar l&apos;aplicació (.apk)
            </a>
          ) : (
            <div className="mt-8">
              <span className="inline-block cursor-not-allowed rounded-lg bg-white/15 px-8 py-4 text-base font-semibold text-white/70">
                Disponible properament
              </span>
              <p className="mt-3 text-sm text-white/60">
                L&apos;aplicació està en preparació. Mentrestant, qualsevol navegador en mode
                quiosc obrint l&apos;adreça del panell ja fa la feina.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ---------- Alta ---------- */}
      <section className="border-t border-slate-200 px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold" style={{ color: NAVY }}>
            Alta gratuïta per a escoles
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Kiosko forma part d&apos;Aulaia, el conjunt d&apos;eines digitals per a centres
            educatius. Si vols donar d&apos;alta la teva escola, omple el formulari i ens posem en
            contacte.
          </p>
          <a
            href={ALTA_FORM_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-block rounded-lg px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:opacity-90"
            style={{ background: ACCENT }}
          >
            Vull donar d&apos;alta el meu centre
          </a>
        </div>
      </section>

      {/* ---------- Peu ---------- */}
      <footer className="px-5 py-10" style={{ background: NAVY }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-white/70 sm:flex-row">
          <div className="text-white">
            <KioskoLogo size={30} accent="#e8467f" subtitle="Un projecte d'Aulaia" />
          </div>
          <div className="flex gap-6 text-sm">
            <a href={ALTA_FORM_URL} target="_blank" rel="noreferrer" className="hover:text-white">
              Alta de centre
            </a>
            <Link href="/dashboard" className="hover:text-white">
              Accés al gestor
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
