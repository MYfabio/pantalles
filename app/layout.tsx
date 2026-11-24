import "./globals.css";
import type { Metadata } from "next";
import Providers from "@/components/Providers";
import { URL_PUBLICA } from "@/lib/seo";

// Sense canònica ni Open Graph globals: només els posa la portada (lib/seo.ts),
// perquè cap pàgina privada (gestor, pantalles) n'hereti una que apunti a la portada.
export const metadata: Metadata = {
  title: "Kiosko - Escola Industrial",
  description: "Gestor de pantalles digitals de l'Escola Industrial",
  metadataBase: new URL(URL_PUBLICA),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ca">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
