import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pantalles - Escola Industrial",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ca">
      <body>{children}</body>
    </html>
  );
}
