import { createAndLogUser, logUser } from "@tests/utils/login.test.utils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { saveAdminUserTest, saveOpcoUserTest } from "@tests/utils/user.test.utils"
import { OPCOS_LABEL } from "shared/constants"
import { generateEntrepriseFixture } from "shared/fixtures/entreprise.fixture"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"

describe("/admin/users/:userId/organization/:siret", () => {
  beforeEach(async () => {
    const entreprise = generateEntrepriseFixture({ opco: OPCOS_LABEL.AKTO, siret: "89557430766546" })
    await getDbCollection("entreprises").insertOne(entreprise)

    return async () => {
      await getDbCollection("entreprises").deleteMany({})
      await getDbCollection("userswithaccounts").deleteMany({})
      await getDbCollection("rolemanagements").deleteMany({})
    }
  })

  useMongo()
  const httpClient = useServer()

  it("Vérifie qu'une création d'ADMIN ou d'utilisateur OPCO légitime fonctionne correctement", async () => {
    const { bearerToken } = await createAndLogUser(httpClient, "userAdmin", { type: "ADMIN" })

    const response1 = await httpClient().inject({
      method: "POST",
      path: "/api/admin/users",
      headers: bearerToken,
      body: {
        email: "admin-bis@mail.fr",
        first_name: "first_name",
        last_name: "last_name",
        phone: "",
        type: "ADMIN",
      },
    })
    expect.soft(response1.statusCode).to.equal(200)

    const response2 = await httpClient().inject({
      method: "POST",
      path: "/api/admin/users",
      headers: bearerToken,
      body: {
        email: "opco-bis@mail.fr",
        first_name: "first_name",
        last_name: "last_name",
        phone: "",
        type: "OPCO",
        opco: OPCOS_LABEL.ATLAS,
      },
    })
    expect.soft(response2.statusCode).to.equal(200)
  })

  it("Vérifie qu'une création d'ADMIN ou d'utilisateur OPCO par un utilisateur OPCO est bloquée", async () => {
    let loggedUser = await createAndLogUser(httpClient, "userOPCO", { type: "OPCO" })
    const response1 = await httpClient().inject({
      method: "POST",
      path: "/api/admin/users",
      headers: loggedUser.bearerToken,
      body: {
        email: "admin-bis@mail.fr",
        first_name: "first_name",
        last_name: "last_name",
        phone: "",
        type: "ADMIN",
      },
    })
    expect.soft(response1.statusCode).to.equal(403)

    loggedUser = await logUser(httpClient, "userOPCO")
    const response2 = await httpClient().inject({
      method: "POST",
      path: "/api/admin/users",
      headers: loggedUser.bearerToken,
      body: {
        email: "opco-bis@mail.fr",
        first_name: "first_name",
        last_name: "last_name",
        phone: "",
        type: "OPCO",
        opco: OPCOS_LABEL.ATLAS,
      },
    })
    expect.soft(response2.statusCode).to.equal(403)
  })

  it("Vérifie qu'une modification des paramètres d'un ADMIN ou d'un utilisateur OPCO légitime fonctionne correctement", async () => {
    const { bearerToken, user } = await createAndLogUser(httpClient, "userAdmin", { type: "ADMIN" })

    const response1 = await httpClient().inject({
      method: "PUT",
      path: `/api/admin/users/${user._id.toString()}`,
      headers: bearerToken,
      body: {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
      },
    })
    expect.soft(response1.statusCode).to.equal(200)

    const userOpco = (await saveOpcoUserTest(OPCOS_LABEL.CONSTRUCTYS)).user

    const response2 = await httpClient().inject({
      method: "PUT",
      path: `/api/admin/users/${userOpco._id.toString()}`,
      headers: bearerToken,
      body: {
        email: userOpco.email,
        first_name: "Newfirstname",
        last_name: "Newlastname",
        phone: "0606060606",
      },
    })
    expect.soft(response2.statusCode).to.equal(200)
  })

  it("Vérifie qu'une modification d'ADMIN ou d'utilisateur OPCO  par un utilisateur OPCO est bloquée", async () => {
    let loggedUser = await createAndLogUser(httpClient, "userOPCO", { type: "OPCO" })
    const adminUser = (await saveAdminUserTest()).user
    const response1 = await httpClient().inject({
      method: "PUT",
      path: `/api/admin/users/${adminUser._id.toString()}`,
      headers: loggedUser.bearerToken,
      body: {
        email: adminUser.email,
        first_name: adminUser.first_name,
        last_name: adminUser.last_name,
        phone: adminUser.phone,
      },
    })
    expect.soft(response1.statusCode).to.equal(403)

    loggedUser = await logUser(httpClient, "userOPCO")
    const opcoUser = (await saveOpcoUserTest(OPCOS_LABEL.CONSTRUCTYS)).user
    const response2 = await httpClient().inject({
      method: "PUT",
      path: `/api/admin/users/${opcoUser._id.toString()}`,
      headers: loggedUser.bearerToken,
      body: {
        email: opcoUser.email,
        first_name: "Newfirstname",
        last_name: "Newlastname",
        phone: "0606060606",
      },
    })
    expect.soft(response2.statusCode).to.equal(403)
  })

  /*
  

  it("Vérifie qu'une modification d'ADMIN ou d'utilisateur OPCO  par un utilisateur OPCO est bloquée", async () => {})

  it("Vérifie qu'une modification d'ADMIN ou d'utilisateur OPCO par un utilisateur ENTREPRISE est bloquée", async () => {})

  it("Vérifie qu'une modification légitime d'OPCO fonctionne correctement", async () => {
    expect(response.statusCode).toBe(200)
  })

  it("Vérifie qu'une modification avec un OPCO farfelue est bloquée", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/version" })
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
  )*/
})
