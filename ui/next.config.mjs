// @ts-check

// eslint-disable-next-line import-x/no-extraneous-dependencies
import createWithBundleAnalyzer from "@next/bundle-analyzer"
import { withSentryConfig } from "@sentry/nextjs"
import { Config } from "next-recompose-plugins"
import path from "path"
import { fileURLToPath } from "url"

const cacheControls = {
  month: "public, max-age=2592000, immutable",
  year: "public, max-age=31536000, immutable",
}

const withBundleAnalyzer = createWithBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})

/**
 * supprime les espacements inutiles pour remettre la séquence sur une seule ligne
 * @param {string} value
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
              https://tally.so
              blob:;
  script-src-attr 'none';
  connect-src 'self'
              https://catalogue-apprentissage.intercariforef.org
              https://data.geopf.fr
              https://stats.beta.gouv.fr
              https://stats.data.gouv.fr
              https://plausible.io
              http://localhost:5000
              https://exposition-recette.inserjeunes.beta.gouv.fr
              https://exposition.inserjeunes.beta.gouv.fr
              https://sentry.apprentissage.beta.gouv.fr
              https://recherche-entreprises.api.gouv.fr
              https://tally.so
              ${process.env.NEXT_PUBLIC_ENV === "local" ? "http://localhost:5001" : ""};
  img-src 'self'
              data:
              blob:
              https://www.notion.so
              https://www.google.com
              https://www.google.fr
              https://tally.so
              https://stats.beta.gouv.fr;
  object-src 'self' data:;
  font-src 'self' https: data:;
  style-src 'self' https: 'unsafe-inline';
  frame-src ${process.env.NEXT_PUBLIC_ENV === "local" ? "http://localhost:3000 https://labonnealternance.apprentissage.beta.gouv.fr" : ""}
            'self'
            https://tally.so
            https://plausible.io;
  child-src 'self' blob:;
  block-all-mixed-content;
  upgrade-insecure-requests;
`
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["shared"],
  productionBrowserSourceMaps: true,
  bundlePagesRouterDependencies: true,
  serverExternalPackages: ["react-pdf"],
  poweredByHeader: false,
  compiler: {
    // Text-replacé (JSON.stringify → il faut le booléen, la chaîne "false" serait truthy) dans le
    // bundle : @sentry/nextjs n'enregistre browserTracingIntegration que si ce flag n'est pas
    // remplacé par false — le module tracing est alors tree-shaké (issue #5186). Le flag n'existe
    // que dans le build client du SDK (vérifié : absent de @sentry/node et @sentry/vercel-edge),
    // le tracing serveur/edge (sentry.server.config.ts, sentry.edge.config.ts) n'est pas affecté.
    define: { __SENTRY_TRACING__: false },
  },
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    fallbackNodePolyfills: false,
    staleTimes: {
      static: 180,
    },
    // Uniquement pour les tests Playwright instant() en local/CI, jamais en production réelle.
    exposeTestingApiInProductionBuild: process.env.PLAYWRIGHT_TEST_MODE === "1",
    // Abaisse le seuil sous lequel Turbopack fusionne un chunk avec ses voisins (défaut 50 ko).
    // À 50 ko, un même groupe de modules partagé entre deux chunk groups clients (ex. error.tsx
    // et le groupe page) est fusionné différemment de chaque côté → deux chunks au contenu
    // différent → pas de partage par hash → double téléchargement (~37,6 ko bruts sur la home,
    // issue #5214). À 20 ko, le groupe reste un chunk autonome identique des deux côtés.
    // Réglage sensible et non monotone : 30_000 est PIRE que le défaut (+10 ko gzip sur /).
    // Toute modification doit être validée par le job Performance budget.
    turbopackChunking: {
      minChunkSize: 20_000,
    },
  },
  output: "standalone",
  compress: false, // disable default gzip compression by nextJS, done by Nginx
  cacheMaxMemorySize: 0, // disable default in-memory caching
  images: {
    unoptimized: true,
    // Tout changement d'image devra passer par un changement de nom de fichier
    // pour être pris en compte par le cache
    minimumCacheTTL: 31 * 24 * 3_600, // 31 jours
    localPatterns: [
      {
        pathname: "/images/**",
        search: "",
      },
    ],
  },
  webpack: (config) => {
    // Required for DSFR
    config.module.rules.push({
      test: /\.woff2?$/,
      type: "asset/resource",
    })

    // Bson is using top-level await, which is not supported by default in Next.js in client side
    // Probably related to https://github.com/vercel/next.js/issues/54282
    config.resolve.alias.bson = path.join(path.dirname(fileURLToPath(import.meta.resolve("bson"))), "bson.cjs")

    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
      ".cjs": [".cts", ".cjs"],
    }

    return config
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: inline(contentSecurityPolicy + " frame-ancestors 'none';"),
          },
        ],
      },
      {
        source: "/:slug(recherche|recherche-emploi|recherche-formation|postuler)",
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
      {
        source: "/:slug(favicon\\.ico|favicon|styles)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: cacheControls.month,
          },
          {
            key: "Content-Security-Policy",
            value: inline(contentSecurityPolicy),
          },
        ],
      },
      {
        source: "/:slug(assets|fonts|images|ressources)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: cacheControls.year,
          },
          {
            key: "Content-Security-Policy",
            value: inline(contentSecurityPolicy),
          },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: "/recherche-apprentissage",
        destination: "/recherche",
        permanent: true,
      },
      {
        source: "/recherche-apprentissage-formation",
        destination: "/recherche?mode=formations",
        permanent: true,
      },
      {
        source: "/recherche-formation",
        destination: "/recherche?mode=formations",
        permanent: true,
      },
      {
        source: "/recherche-emploi",
        destination: "/recherche?mode=emplois",
        permanent: true,
      },
      {
        source: "/beta/recherche",
        destination: "/recherche",
        permanent: true,
      },
      {
        source: "/espace-pro/establishment/:etablissementId/appointments/:appointmentId",
        destination: "/detail-rendez-vous/:appointmentId",
        permanent: true,
      },
      {
        source: "/acces-recruteur",
        destination: "/je-suis-recruteur",
        permanent: true,
      },
      {
        source: "/organisme-de-formation",
        destination: "/je-suis-cfa",
        permanent: true,
      },
    ]
  },
}

const sentryConfig = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "sentry",
  project: "lba-ui",
  sentryUrl: "https://sentry.apprentissage.beta.gouv.fr/",

  // Le tracing client est volontairement retiré (issue #5186) : sans ce flag, chaque build
  // afficherait « ACTION REQUIRED » en demandant de réexporter onRouterTransitionStart depuis
  // instrumentation-client.ts — soit exactement ce que la décision d'équipe a supprimé.
  suppressOnRouterTransitionStartWarning: true,

  // Only print logs for uploading source maps in CI
  silent: false,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Formes non dépréciées depuis Sentry 10.x : reactComponentAnnotation et le tree-shaking
  // du logger (ex-disableLogger) vivent sous `webpack`. hideSourceMaps a été retiré du SDK
  // (la rétention des sourcemaps est pilotée par `sourcemaps` ci-dessous).
  webpack: {
    // Automatically annotate React components to show their full name in breadcrumbs and session replay
    reactComponentAnnotation: { enabled: true },
    // Automatically tree-shake Sentry logger statements to reduce bundle size
    treeshake: { removeDebugLogging: true },
  },

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  sourcemaps: {
    disable: false,
    deleteSourcemapsAfterUpload: false,
  },
}

const NextJConfig = new Config(nextConfig)
  .applyPlugin((phase, args, config) => withSentryConfig(config, sentryConfig))
  .applyPlugin((phase, args, config) => withBundleAnalyzer(config))
  .build()

export default NextJConfig
