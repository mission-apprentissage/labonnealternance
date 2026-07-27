import { createAndLogUser } from "@tests/utils/login.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { describe, expect, it, vi } from "vitest"

vi.mock("job-processor", async (importOriginal) => {
  const mod = await importOriginal<typeof import("job-processor")>()
  return { ...mod, addJob: vi.fn().mockResolvedValue(undefined) }
})

describe("processorAdminRoutes", () => {
  useMongo()
  const httpClient = useServer()

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
