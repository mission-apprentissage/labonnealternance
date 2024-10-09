/*import assert from "assert"

import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"

import { beforeEach, describe, expect, it } from "vitest"
import { createAndLogUser } from "@tests/utils/login.test.utils"
import { OPCOS_LABEL } from "shared/constants"
import { generateEntrepriseFixture } from "shared/fixtures/entreprise.fixture"
import { getDbCollection } from "@/common/utils/mongodbUtils"

describe("/admin/users/:userId/organization/:siret", () => {


  beforeEach(async () => {
    const entreprise = generateEntrepriseFixture({opco: OPCOS_LABEL.AKTO, siret: "89557430766546"})
    await getDbCollection("entreprises").insertOne(entreprise)
    
    return async () => {
      await getDbCollection("entreprises").deleteMany({})
    }
  })

  useMongo()
  const httpClient = useServer()
  it("Vérifie qu'une modification légitime d'OPCO fonctionne correctement", async () => {


    const bearerToken = await createAndLogUser(httpClient, "userAdmin", { type: "ADMIN" })

    expect(response.statusCode).toBe(200)
  })

  it("Vérifie qu'une modification avec un OPCO farfelue est bloquée", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/version" })

    assert(isSemver(JSON.parse(response.body).version))
  })
})


  server.put(
    "/admin/users/:userId/organization/:siret",
    {
      schema: zRoutes.put["/admin/users/:userId/organization/:siret"],
      onRequest: [server.auth(zRoutes.put["/admin/users/:userId/organization/:siret"])],
    },
    async (req, res) => {
      const { userId, siret } = req.params
      const { opco, ...userFields } = req.body

      if (!isEnum(OPCOS_LABEL, opco)) {
        throw badRequest("Uknown OPCO value", { error: BusinessErrorCodes.UNSUPPORTED })
      }
      const result = await updateUserWithAccountFields(userId, userFields)
      if ("error" in result) {
        throw badRequest("L'email est déjà utilisé", { error: BusinessErrorCodes.EMAIL_ALREADY_EXISTS })
      }
      if (opco) {
        const entreprise = await getDbCollection("entreprises").findOneAndUpdate({ siret }, { $set: { opco, updatedAt: new Date() } }, { returnDocument: "after" })
        if (!entreprise) {
          throw badRequest(`pas d'entreprise ayant le siret ${siret}`)
        }
      }
      return res.status(200).send({ ok: true })
    }
  )
/*
*/
