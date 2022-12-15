const path = require("path")
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
              https://cdn.tagcommander.com
              https://cdn.trustcommander.net/
              https://static.hotjar.com
              https://script.hotjar.com
              https://www.googletagmanager.com
              https://www.google-analytics.com
              https://client.crisp.chat
              https://plausible.io 
              http://localhost:3000 
              blob:; 
  script-src-attr 'none';
  connect-src 'self'
              https://labonnealternance.apprentissage.beta.gouv.fr 
              https://labonnealternance-recette.apprentissage.beta.gouv.fr
              https://labonnealternance.pole-emploi.fr
              https://rdv-cfa.apprentissage.beta.gouv.fr 
              https://rdv-cfa-recette.apprentissage.beta.gouv.fr 
              https://catalogue.apprentissage.beta.gouv.fr 
              https://catalogue-recette.apprentissage.beta.gouv.fr 
              https://api-adresse.data.gouv.fr 
              https://api.mapbox.com 
              https://events.mapbox.com 
              https://raw.githubusercontent.com 
              https://privacy.trustcommander.net
              https://privacy.commander1.com
              https://stats.g.doubleclick.net
              https://*.hotjar.com
              wss://*.hotjar.com
              wss://client.relay.crisp.chat
              https://*.hotjar.io
              https://www.google-analytics.com
              https://in.hotjar.com
              https://plausible.io 
              http://localhost:5000; 
  img-src 'self' 
              data: 
              blob:
              https://www.notion.so
              https://www.google-analytics.com
              https://www.google.com
              https://www.google.fr
              https://script.hotjar.com
              https://manager.tagcommander.com; 
  object-src 'self' data: 
              https://labonnealternance.apprentissage.beta.gouv.fr
              https://labonnealternance-recette.apprentissage.beta.gouv.fr
              https://labonnealternance.pole-emploi.fr;
  font-src 'self' https: data:;
  style-src 'self' https: 'unsafe-inline';
  frame-src https://rdv-cfa.apprentissage.beta.gouv.fr 
            https://matcha.apprentissage.beta.gouv.fr
            https://doctrina.apprentissage.beta.gouv.fr 
            https://doctrina-recette.apprentissage.beta.gouv.fr 
            https://plausible.io 
            https://vars.hotjar.com
            https://cdn.trustcommander.net
            https://labonnealternance.pole-emploi.fr
            https://labonnealternance.apprentissage.beta.gouv.fr
            https://labonnealternance-recette.apprentissage.beta.gouv.fr;
  child-src 'self' blob:;
  block-all-mixed-content;
  upgrade-insecure-requests;
`

/** @type {import('next').NextConfig} */
const nextConfig = withImages({
  sassOptions: {
    includePaths: [path.join(__dirname, "/public/styles")],
  },
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
            value: inline(contentSecurityPolicy),
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
