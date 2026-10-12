import * as Sentry from "@sentry/node"

import { getSentryOptions } from "@/common/sentry/sentry"

// Envois Sentry réels (config de production, hors profiling), interceptés au niveau du transport.
// Sentry est initialisé à l'import, avant le chargement de mongodb, pour que les spans MongoDB soient
// instrumentés : ce module doit être le premier import du fichier de test.
export const sentryEnvelopes: string[] = []

const { integrations, ...options } = getSentryOptions()

Sentry.init({
  ...options,
  enabled: true,
  dsn: "https://public@sentry.exemple.fr/1",
  // Toutes les requêtes sont tracées pour contrôler aussi les transactions, envoyées en production pour 1 % des requêtes.
  tracesSampler: () => 1,
  profilesSampleRate: 0,
  integrations: (integrations as Extract<NonNullable<typeof integrations>, unknown[]>).filter((integration) => integration.name !== "ProfilingIntegration"),
  transport: (transportOptions) =>
    Sentry.createTransport(transportOptions, async (request) => {
      sentryEnvelopes.push(typeof request.body === "string" ? request.body : new TextDecoder().decode(request.body))
      return { statusCode: 200 }
    }),
})

type SentItem = { type: string; payload: unknown }

function sentItems(): SentItem[] {
  return sentryEnvelopes.flatMap((envelope) => {
    const [header, ...lines] = envelope.split("\n").filter(Boolean)
    const items: SentItem[] = [{ type: "envelope-header", payload: JSON.parse(header) }]
    for (let i = 0; i < lines.length; i += 2) {
      items.push({ type: JSON.parse(lines[i]).type, payload: JSON.parse(lines[i + 1]) })
    }
    return items
  })
}

export function sentEvents(type: "event" | "transaction"): Sentry.Event[] {
  return sentItems()
    .filter((item) => item.type === type)
    .map((item) => item.payload as Sentry.Event)
}

export type SentryLeak = { item: string; path: string; marker: string }

function collectLeaks(value: unknown, path: string, item: string, markers: Record<string, string>, leaks: SentryLeak[]) {
  if (typeof value === "string") {
    for (const [name, marker] of Object.entries(markers)) {
      if (value.includes(marker) || value.includes(encodeURIComponent(marker))) leaks.push({ item, path, marker: name })
    }
  } else if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      collectLeaks(child, path ? `${path}.${key}` : key, item, markers, leaks)
    }
  }
}

/** Champs des envois où figure un marqueur, en clair ou encodé dans une URL. */
export function findSentryLeaks(markers: Record<string, string>): SentryLeak[] {
  const leaks: SentryLeak[] = []
  for (const { type, payload } of sentItems()) {
    collectLeaks(payload, "", type, markers, leaks)
  }
  return leaks
}
