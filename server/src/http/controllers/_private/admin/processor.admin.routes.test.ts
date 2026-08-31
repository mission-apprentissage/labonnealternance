import { createAndLogUser } from "@tests/utils/login.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { ObjectId } from "mongodb"
import { describe, expect, it, vi } from "vitest"

// fixtureStatus déclaré via vi.hoisted : vi.mock est hoisté en tête de fichier par Vitest, une const
// module-scope normale ne serait pas encore initialisée au moment où la factory du mock l'utilise.
const { fixtureStatus } = vi.hoisted(() => {
  // require plutôt que l'import ESM du haut de fichier : celui-ci est réécrit par Vitest en accès
  // paresseux (__vi_import_N__), pas encore initialisé au moment où cette factory hoistée s'exécute.
  // biome-ignore lint/style/noCommonJs: cf. commentaire ci-dessus
  const { ObjectId: HoistedObjectId } = require("mongodb")
  return {
    fixtureStatus: {
      now: new Date(),
      workers: [],
      queue: [],
      crons: [],
      jobs: [
        {
          name: "test-job",
          tasks: [
            {
              _id: new HoistedObjectId(),
              name: "test-job",
              type: "simple",
              status: "finished",
              sync: false,
              payload: null,
              output: null,
              scheduled_for: new Date(),
              started_at: null,
              ended_at: null,
              updated_at: new Date(),
              created_at: new Date(),
              worker_id: null,
            },
          ],
        },
      ],
    },
  }
})

vi.mock("job-processor", async (importOriginal) => {
  const mod = await importOriginal<typeof import("job-processor")>()
  return { ...mod, addJob: vi.fn().mockResolvedValue(undefined), getProcessorStatus: vi.fn().mockResolvedValue(fixtureStatus) }
})

describe("processorAdminRoutes", () => {
  useMongo()
  const httpClient = useServer()

  it("Vérifie que GET /_private/admin/processor ne plante pas quand un job réel (donc un ObjectId) est présent", async () => {
    // Régression : zProcessorStatus (job-processor) encode ses ObjectId via un .transform() zod-mini à
    // sens unique. Le serializerCompiler par défaut de fastify-type-provider-zod tente d'encoder la
    // réponse et lève ZodEncodeError dès qu'un job réel (donc un ObjectId) est présent — une réponse
    // vide ne le déclenche pas, d'où le fixture ci-dessus plutôt qu'un simple appel à vide.
    const { bearerToken } = await createAndLogUser(httpClient, "processorAdminStatus", { type: "ADMIN" })

    const response = await httpClient().inject({
      method: "GET",
      path: "/api/_private/admin/processor",
      headers: bearerToken,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().jobs).toEqual(expect.arrayContaining([expect.objectContaining({ name: "test-job" })]))
  })

  it("Vérifie qu'un utilisateur non connecté ne peut pas déclencher un job", async () => {
    const response = await httpClient().inject({
      method: "POST",
      path: "/api/_private/admin/processor/trigger",
      body: { job: "processApplications" },
    })

    expect(response.statusCode).toBe(403)
  })

  it("Vérifie qu'un utilisateur non admin ne peut pas déclencher un job", async () => {
    const { bearerToken } = await createAndLogUser(httpClient, "processorCfa", { type: "CFA" })

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/_private/admin/processor/trigger",
      headers: bearerToken,
      body: { job: "processApplications" },
    })

    expect(response.statusCode).toBe(403)
  })

  it("Vérifie qu'un administrateur peut déclencher un job", async () => {
    const { bearerToken } = await createAndLogUser(httpClient, "processorAdmin", { type: "ADMIN" })

    const response = await httpClient().inject({
      method: "POST",
      path: "/api/_private/admin/processor/trigger",
      headers: bearerToken,
      body: { job: "processApplications" },
    })

    expect(response.statusCode).toBe(200)
  })
})
