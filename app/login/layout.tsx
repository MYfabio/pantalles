import { METADADES_PRIVADA } from "@/lib/seo";

// La pàgina d'accés és un component de client i no pot exportar metadades: les posa aquest layout.
export const metadata = METADADES_PRIVADA;

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
