// @ts-check
import path from "path"
import { fileURLToPath } from "url"

import createWithBundleAnalyzer from "@next/bundle-analyzer"
import { withSentryConfig } from "@sentry/nextjs"
import { Config } from "next-recompose-plugins"

const cacheControls = {
  month: "public, max-age=2592000, immutable",
  year: "public, max-age=31536000, immutable",
}

const withBundleAnalyzer = createWithBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})

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
              https://kl08pfb3hu-3.algolianet.com
              https://kl08pfb3hu-dsn.algolia.net
              https://cdn.jsdelivr.net
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
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["shared"],
  i18n: {
    locales: ["fr"],
    defaultLocale: "fr",
  },
  productionBrowserSourceMaps: true,
  bundlePagesRouterDependencies: true,
  serverExternalPackages: ["react-pdf"],
  poweredByHeader: false,
  experimental: {
    fallbackNodePolyfills: false,
  },
  output: "standalone",
  eslint: {
    dirs: ["."],
  },
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
        destination: "/recherche-formation",
        permanent: true,
      },
      {
        source: "/espace-pro/establishment/:etablissementId/appointments/:appointmentId",
        destination: "/detail-rendez-vous/:appointmentId",
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

  // Only print logs for uploading source maps in CI
  silent: false,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: false,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

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
