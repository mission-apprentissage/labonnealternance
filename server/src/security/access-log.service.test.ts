import { getApiApprentissageTestingToken } from "@tests/utils/jwt.test.utils"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import type { Server } from "@/http/server"
import { bindFastifyServer } from "@/http/server"

// Sentry doit instrumenter http avant le chargement du serveur pour continuer la trace entrante.
// Échantillonnage de production : une requête suit la décision de l'appelant.
await vi.hoisted(async () => {
  const Sentry = await import("@sentry/node")
  const { getSentryOptions } = await import("@/common/sentry/sentry")
  const { integrations, ...options } = getSentryOptions()
  Sentry.init({
    ...options,
    enabled: true,
    dsn: "https://public@sentry.exemple.fr/1",
    profilesSampleRate: 0,
    integrations: (integrations as Extract<NonNullable<typeof integrations>, unknown[]>).filter((integration) => integration.name !== "ProfilingIntegration"),
    transport: (transportOptions) => Sentry.createTransport(transportOptions, async () => ({ statusCode: 200 })),
  })
})

const logLines = vi.hoisted(() => [] as Record<string, unknown>[])

// Le logger racine, silencieux en test, est celui dont Fastify dérive le logger de chaque requête.
vi.mock("@/common/logger", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/common/logger")>()
  const { Writable } = await import("node:stream")
  const { default: pino } = await import("pino")
  const destination = new Writable({
    write(chunk, _encoding, callback) {
      for (const line of chunk.toString().split("\n").filter(Boolean)) logLines.push(JSON.parse(line))
      callback()
    },
  })
  const rootLogger = pino({ level: "info", serializers: actual.serializers }, destination)
  return { ...actual, getRootLogger: () => rootLogger }
})

const consumer = { email: "consommateur.fictif@exemple.fr", organisation: "Partenaire fictif" }
const traceId = "0af7651916cd43dd8448eb211c80319c"

describe("accessLog d'un appel de l'API Apprentissage", () => {
  let app: Server
  let baseUrl: string
  let token: string

  beforeAll(async () => {
    token = await getApiApprentissageTestingToken({
      ...consumer,
      habilitations: { "applications:write": false, "appointments:write": false, "jobs:write": false },
    })
    app = await bindFastifyServer()
    baseUrl = await app.listen({ port: 0, host: "127.0.0.1" })
  }, 20_000)

  beforeEach(() => {
    logLines.length = 0
  })

  afterAll(async () => {
    await app.close()
  })

  // Paramètres invalides : 400 à la validation, qui suit l'authentification, sans requête en base.
  const callApi = async (headers: Record<string, string> = {}) => {
    const response = await fetch(`${baseUrl}/api/v3/jobs/search?latitude=invalide`, { headers: { authorization: `Bearer ${token}`, ...headers } })
    expect(response.status).toBe(400)
    const accessLogs = logLines.filter((line) => line.module === "accessLog")
    expect(accessLogs).toHaveLength(1)
    return accessLogs[0]
  }

  it("porte le reqId de la requête, comme ses autres lignes", async () => {
    const accessLog = await callApi()

    expect(accessLog.reqId).toEqual(expect.any(String))
    expect(new Set(logLines.map((line) => line.reqId))).toEqual(new Set([accessLog.reqId]))
  })

  it("garde l'organisation et l'e-mail du consommateur", async () => {
    const accessLog = await callApi()

    expect(accessLog).toMatchObject({ authorized: true, user_type: "IApiApprentissage", user_email: consumer.email, user_organisation: consumer.organisation })
  })

  it.each([
    ["non échantillonnée", "0"],
    ["échantillonnée", "1"],
  ])("reprend le trace_id de l'en-tête sentry-trace entrant, trace %s", async (_label, sampled) => {
    const accessLog = await callApi({ "sentry-trace": `${traceId}-b7ad6b7169203331-${sampled}` })

    expect(accessLog.trace_id).toBe(traceId)
  })

  it("porte un trace_id sans en-tête sentry-trace entrant", async () => {
    const accessLog = await callApi()

    expect(accessLog.trace_id).toMatch(/^[0-9a-f]{32}$/)
    expect(accessLog.trace_id).not.toBe(traceId)
  })
})
