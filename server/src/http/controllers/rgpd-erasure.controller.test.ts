import { createAndLogUser, logUser } from "@tests/utils/login.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { RGPD_ERASURE_MODE, RGPD_USER_TYPE } from "shared/models/rgpd-erasure.model"
import { describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"

vi.mock("@/common/utils/slack-utils")

describe("POST /admin/rgpd/*", () => {
  useMongo()
  const httpClient = useServer()

  const post = (path: "/admin/rgpd/preview" | "/admin/rgpd/erase", headers: Record<string, string>, body: object) =>
    httpClient().inject({ method: "POST", path: `/api${path}`, headers, body })

  const target = { user_type: RGPD_USER_TYPE.CFA, email: "cfa-rgpd@mail.com", mode: RGPD_ERASURE_MODE.ANONYMIZE }

  it("refuse un utilisateur qui n'est pas administrateur", async () => {
    await createAndLogUser(httpClient, "cfa-rgpd", { type: "CFA" })
    await createAndLogUser(httpClient, "opco-rgpd", { type: "OPCO" })

    // Une réponse 403 ferme la session (cf. errorMiddleware) : chaque appel refusé part d'une connexion neuve.
    const preview = await post("/admin/rgpd/preview", (await logUser(httpClient, "opco-rgpd")).bearerToken, target)
    const erase = await post("/admin/rgpd/erase", (await logUser(httpClient, "opco-rgpd")).bearerToken, { ...target, request_ref: null })

    expect([preview.statusCode, erase.statusCode]).toEqual([403, 403])
    expect(await getDbCollection("userswithaccounts").countDocuments({ email: "cfa-rgpd@mail.com" })).toBe(1)
  })

  it("prévisualise puis efface un compte, dont la session ouverte cesse d'être valide", async () => {
    const { bearerToken: adminToken } = await createAndLogUser(httpClient, "admin-rgpd", { type: "ADMIN" })
    const { bearerToken: cfaToken } = await createAndLogUser(httpClient, "cfa-rgpd", { type: "CFA" })

    expect((await httpClient().inject({ method: "GET", path: "/api/auth/access", headers: cfaToken })).statusCode).toBe(200)

    const preview = await post("/admin/rgpd/preview", adminToken, target)
    expect(preview.statusCode).toBe(200)
    expect(preview.json()).toMatchObject({ found: true, other_user_types: [] })

    const erase = await post("/admin/rgpd/erase", adminToken, { ...target, request_ref: "#5819" })
    expect(erase.statusCode).toBe(200)
    expect(erase.json()).toMatchObject({ status: "done" })
    expect(await getDbCollection("userswithaccounts").countDocuments({ email: "cfa-rgpd@mail.com" })).toBe(0)

    const session = await httpClient().inject({ method: "GET", path: "/api/auth/access", headers: cfaToken })
    expect(session.statusCode).toBe(401)
  })

  it("répond 404 quand aucun utilisateur du type demandé ne correspond", async () => {
    const { bearerToken } = await createAndLogUser(httpClient, "admin-rgpd", { type: "ADMIN" })

    const erase = await post("/admin/rgpd/erase", bearerToken, { ...target, email: "inconnu@mail.com", request_ref: null })

    expect(erase.statusCode).toBe(404)
  })
})
