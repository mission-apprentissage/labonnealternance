// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { captureConsoleIntegration, captureRouterTransitionStart, extraErrorDataIntegration, httpClientIntegration, init, reportingObserverIntegration } from "@sentry/nextjs"

import { shouldReloadOnce } from "@/utils/reload-guard.utils"

import { publicConfig } from "./config.public"

init({
  dsn: publicConfig.sentry_dsn,
  tracesSampleRate: publicConfig.env === "production" ? 0.001 : 1.0,
  tracePropagationTargets: [/^https:\/\/[^/]*\.apprentissage\.beta\.gouv\.fr/, publicConfig.baseUrl, publicConfig.apiEndpoint, /^\//],
  environment: publicConfig.env,
  enabled: !publicConfig.sentryDisabled,
  release: publicConfig.version,
  normalizeDepth: 8,
  // replaysOnErrorSampleRate: 1.0,
  // replaysSessionSampleRate: 0.1,
  integrations: [
    captureConsoleIntegration({ levels: ["error"] }),
    extraErrorDataIntegration({ depth: 8 }),
    httpClientIntegration({}),
    // "deprecation"/"intervention" ne rapportent que des avertissements passifs du navigateur
    // (API obsolètes type InstallTrigger, StorageType.persistent…), jamais du code LBA — non
    // actionnables, gardés hors Sentry. "crash" reste utile (vrai crash navigateur).
    reportingObserverIntegration({ types: ["crash"] }),
  ],
  sendDefaultPii: true,
  ignoreErrors: [
    "AbortError",
    // Erreurs provenant d'extensions navigateur tierces (MetaMask, gestionnaires d'onglets…),
    // non actionnables côté LBA.
    "func sseError not found",
    "Failed to connect to MetaMask",
    /SCDynimacBridge/,
    "No Listener: tabs:outgoing.message.ready",
    "Invalid call to runtime.sendMessage",
  ],
  beforeSend(event) {
    // Hydratation error comes from DSFR
    if (event.extra?.arguments && Array.isArray(event.extra?.arguments) && event.extra?.arguments?.includes("https://react.dev/link/hydration-mismatch")) {
      return null
    }

    console.info(event)
    return event
  },
})

export const onRouterTransitionStart = captureRouterTransitionStart

// Pendant un déploiement (rolling update Docker Swarm), un onglet resté ouvert peut garder en
// mémoire des chunks JS de l'ancien build : le routeur y navigue ensuite vers des modules qui
// n'existent plus (ou plus au même endroit) côté nouveau déploiement. Deux signatures fiables
// (Sentry LBA-UI-2DH, LBA-UI-5CVZZZZZZG4M9) sont ciblées ici, hors du render React (promesse de
// chargement de chunk / appel de Server Action) — un simple reload récupère le build courant.
// NB : un TypeError générique "X is not a function" (LBA-UI-5CVZZZZZZG4QA) a la même origine
// probable, mais matcher ce pattern trop largement risquerait de masquer de vrais bugs ; il n'est
// donc PAS couvert ici. Le rendu React est couvert séparément par ErrorComponent.tsx (ChunkLoadError
// uniquement, via error boundary) — même clé de garde-fou pour ne compter qu'un seul reload.
if (typeof window !== "undefined") {
  const isStaleDeploymentError = (error: unknown): boolean => {
    if (!(error instanceof Error)) return false
    if (error.name === "ChunkLoadError") return true
    return error.message.includes("Failed to find Server Action")
  }

  const reloadOnce = () => {
    if (shouldReloadOnce("lba:staleDeploymentReload", 30000)) {
      window.location.reload()
    }
  }

  window.addEventListener("error", (event) => {
    if (isStaleDeploymentError(event.error)) reloadOnce()
  })
  window.addEventListener("unhandledrejection", (event) => {
    if (isStaleDeploymentError(event.reason)) reloadOnce()
  })
}
