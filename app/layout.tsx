import "./globals.css";
import type { Metadata } from "next";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Kiosko - Escola Industrial",
  description: "Gestor de pantalles digitals de l'Escola Industrial",
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
