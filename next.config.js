/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Next 14: cal activar instrumentation.ts (informe d'activitat cap a aulaia.cat).
  experimental: { instrumentationHook: true },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
      // El tauler d'administració no s'ha de poder incrustar en una altra web (clickjacking).
      // Les pantalles (/panel/...) queden fora: algun reproductor les pot mostrar dins d'un marc.
      ...["/dashboard/:path*", "/login"].map((source) => ({
        source,
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        ],
      })),
    ];
  },
};
module.exports = nextConfig;
