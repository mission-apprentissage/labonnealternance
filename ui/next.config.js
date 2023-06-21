const withImages = require("next-images")

/**
 * supprime les espacements inutiles pour remettre la séquence sur une seule ligne
 */
function inline(value) {
  return value.replace(/\s{2,}/g, " ").trim()
}

const contentSecurityPolicy = `
  default-src 'self'; 
  base-uri 'self';
  script-src 'self' 
              'unsafe-inline' 
              'unsafe-eval' 
              https://plausible.io 
              http://localhost:3000 
              https://stats.beta.gouv.fr
              blob:; 
  script-src-attr 'none';
  connect-src 'self'
              https://labonnealternance.apprentissage.beta.gouv.fr 
              https://labonnealternance-recette.apprentissage.beta.gouv.fr
              https://labonnealternance.pole-emploi.fr
              https://catalogue-apprentissage.intercariforef.org
              https://api-adresse.data.gouv.fr 
              https://api.mapbox.com 
              https://stats.beta.gouv.fr
              https://events.mapbox.com 
              https://plausible.io 
              http://localhost:5000
              https://exposition-recette.inserjeunes.beta.gouv.fr 
              https://exposition.inserjeunes.beta.gouv.fr 
              https://*.ingest.sentry.io;
  img-src 'self' 
              data: 
              blob:
              https://www.notion.so
              https://www.google.com
              https://www.google.fr; 
  object-src 'self' data: 
              https://labonnealternance.apprentissage.beta.gouv.fr
              https://labonnealternance-recette.apprentissage.beta.gouv.fr
              https://labonnealternance.pole-emploi.fr;
  font-src 'self' https: data:;
  style-src 'self' https: 'unsafe-inline';
  frame-src http://localhost
            http://localhost:3000
            https://plausible.io             
            https://labonnealternance.pole-emploi.fr
            https://labonnealternance.apprentissage.beta.gouv.fr
            https://labonnealternance-recette.apprentissage.beta.gouv.fr;
  child-src 'self' blob:;
  block-all-mixed-content;
  upgrade-insecure-requests;
`

/** @type {import('next').NextConfig} */
const nextConfig = withImages({
  reactStrictMode: true,
  output: "standalone",
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Content-Security-Policy",
            value: inline(contentSecurityPolicy + " frame-ancestors 'none';"),
          },
          {
            key: "Referrer-Policy",
            value: "unsafe-url",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "X-XSS-Protection",
            value: "1",
          },
        ],
      },
      {
        source: "/:slug(recherche-apprentissage|recherche-emploi|recherche-apprentissage-formation|postuler)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: inline(contentSecurityPolicy),
          },
        ],
      },
    ]
  },
})

module.exports = nextConfig
