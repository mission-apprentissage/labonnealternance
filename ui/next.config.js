const { withSentryConfig } = require("@sentry/nextjs")
// eslint-disable-next-line @typescript-eslint/no-var-requires
const withImages = require("next-images")

/**
 * supprime les espacements inutiles pour remettre la séquence sur une seule ligne
 */
function inline(value) {
  return value.replace(/\s{2,}/g, " ").trim()
}

const contentSecurityPolicy = `
  default-src 'self';
  base-uri 'self'
              https://stats.beta.gouv.fr;
  script-src 'self'
              'unsafe-inline'
              ${process.env.NEXT_PUBLIC_ENV === "local" ? "'unsafe-eval'" : ""}
              https://plausible.io
              http://localhost:3000
              https://stats.beta.gouv.fr
              https://stats.data.gouv.fr
              blob:;
  script-src-attr 'none';
  connect-src 'self'
              https://catalogue-apprentissage.intercariforef.org
              https://api-adresse.data.gouv.fr
              https://api.mapbox.com
              https://stats.beta.gouv.fr
              https://stats.data.gouv.fr
              https://events.mapbox.com
              https://plausible.io
              http://localhost:5000
              https://exposition-recette.inserjeunes.beta.gouv.fr
              https://exposition.inserjeunes.beta.gouv.fr
              https://sentry.apprentissage.beta.gouv.fr
              https://recherche-entreprises.api.gouv.fr
              ${process.env.NEXT_PUBLIC_ENV === "local" ? "http://localhost:5001" : ""};
  img-src 'self'
              data:
              blob:
              https://www.notion.so
              https://www.google.com
              https://www.google.fr
              https://stats.beta.gouv.fr;
  object-src 'self' data:;
  font-src 'self' https: data:;
  style-src 'self' https: 'unsafe-inline';
  frame-src ${process.env.NEXT_PUBLIC_ENV === "local" ? "http://localhost:3000" : ""}
            'self'
            https://plausible.io;
  child-src 'self' blob:;
  block-all-mixed-content;
  upgrade-insecure-requests;
`

/** @type {import('next').NextConfig} */
const nextConfig = withImages({
  // reactStrictMode: true,
  transpilePackages: ["shared"],
  i18n: {
    locales: ["fr"],
    defaultLocale: "fr",
  },
  productionBrowserSourceMaps: true,
  poweredByHeader: false,
  swcMinify: true,
  experimental: {
    typedRoutes: true,
  },
  output: "standalone",
  eslint: {
    dirs: ["."],
  },
  sentry: {
    disableServerWebpackPlugin: true,
    disableClientWebpackPlugin: true,
    hideSourceMaps: false,
    widenClientFileUpload: true,
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
      {
        source: "/espace-pro/widget/:slug*",
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

module.exports = withSentryConfig(nextConfig)
