import type { MetadataRoute } from "next"

// Servi sur /manifest.webmanifest — hors de /favicon/ qui est en Cache-Control immutable 30 jours (next.config.mjs)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "La bonne alternance",
    short_name: "LBA",
    description: "La bonne alternance vous aide à trouver un emploi en alternance et une formation en apprentissage. Service public gratuit, des milliers d'offres en France.",
    id: "/",
    scope: "/",
    // utm_source distingue les lancements depuis l'app installée dans le tracking
    start_url: "/?utm_source=pwa",
    display: "standalone",
    lang: "fr",
    theme_color: "#000091",
    background_color: "#ffffff",
    icons: [
      { src: "/favicon/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/favicon/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/favicon/maskable-icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/favicon/maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
