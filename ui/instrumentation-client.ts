// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { extraErrorDataIntegration, httpClientIntegration, init, reportingObserverIntegration } from "@sentry/nextjs"

import { shouldReloadOnce } from "@/utils/reload-guard.utils"

import { publicConfig } from "./config.public"

// Pas de tracing client (issue #5186, décision d'équipe 2026-08) : à 0,1 % de sample il
// n'apportait presque rien, et son retrait permet le tree-shaking du module tracing via le flag
// __SENTRY_TRACING__ (voir compiler.define dans next.config.mjs). Conséquences assumées : plus de
// transactions pageload/navigation client, plus de propagation des trace headers vers l'API.
// Le tracing serveur (sentry.server.config.ts / lba-server) est inchangé.
init({
  dsn: publicConfig.sentry_dsn,
  environment: publicConfig.env,
  enabled: !publicConfig.sentryDisabled,
  release: publicConfig.version,
  normalizeDepth: 8,
  // replaysOnErrorSampleRate: 1.0,
  // replaysSessionSampleRate: 0.1,
  integrations: [
    // captureConsoleIntegration retirée (issue #5186) : 2 issues / 14 événements / 0 utilisateur
    // en 90 jours de prod, et le seul cas capté était un TypeError mieux traité en vraie exception.
    extraErrorDataIntegration({ depth: 8 }),
    httpClientIntegration({}),
    // "deprecation"/"intervention" ne rapportent que des avertissements passifs du navigateur
    // (API obsolètes type InstallTrigger, StorageType.persistent…), jamais du code LBA — non
    // actionnables, gardés hors Sentry. "crash" reste utile (vrai crash navigateur).
    reportingObserverIntegration({ types: ["crash"] }),
  ],
  sendDefaultPii: true,
  denyUrls: [
    // Scripts injectés par des extensions/WebViews tiers, jamais servis par LBA (aucun
    // "executors" dans le code ni le build Next — frames type app:///executors/200.js,
    // ex. TypeError "reading 'M_ID'", Sentry LBA-UI-5CVZZZZZZG4T4, ~2 300 events/7j).
    /\/executors\/\d+\.js/,
  ],
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

    // Une extension navigateur (traducteur, gestionnaire de mots de passe…) mute le DOM en
    // parallèle du commit React, qui perd ensuite la référence du nœud pendant son cleanup.
    // On ne filtre que si TOUTES les frames sont internes à react-dom-client.production.js
    // (aucune frame applicative) : un `ignoreErrors` sur le seul texte matcherait aussi
    // "The object can not be found here." (message générique WebKit pour n'importe quelle
    // NotFoundError, pas seulement removeChild) ou un futur vrai bug applicatif qui produirait
    // le même message par coïncidence. Chronique depuis fin juin/début juillet 2026, sans lien
    // avec un déploiement (Sentry LBA-UI-5CVZZZZZZG3V9 ~1350 events, LBA-UI-5CVZZZZZZG3XY
    // ~320 events, vérifié 2026-08-25).
    const exception = event.exception?.values?.[0]
    const isRemoveChildMessage = exception?.value === "The object can not be found here." || exception?.value?.includes("reading 'removeChild'")
    if (isRemoveChildMessage) {
      const frames = exception?.stacktrace?.frames ?? []
      const hasNoApplicationFrame = frames.every((frame) => !frame.filename || frame.filename === "[native code]" || /react-dom-client\.production\.js$/.test(frame.filename))
      if (hasNoApplicationFrame) return null
    }

    console.info(event)
    return event
  },
})

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
