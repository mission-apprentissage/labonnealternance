import omit from "lodash/omit"
import nock from "nock"
import { ENTREPRISE, OPCOS_LABEL } from "shared/constants"
import { z } from "shared/helpers/zodWithOpenApi"
import { UserEventType } from "shared/models"
import { zRoutes } from "shared/routes"
import { beforeEach, describe, expect, it } from "vitest"

import { apiEntrepriseEtablissementFixture } from "@/common/apis/apiEntreprise/apiEntreprise.client.fixture"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"

describe("POST /etablissement/creation", () => {
  useMongo()
  const httpClient = useServer()

  beforeEach(async () => {
    const mockEntreprise = nock("https://entreprise.api.gouv.fr/v3/insee")
      .persist()
      .get(new RegExp("/sirene/etablissements/diffusibles/", "g"))
      .reply(200, apiEntrepriseEtablissementFixture.dinum)
    return () => {
      mockEntreprise.persist(false)
    }
  })

  const responseSchema = zRoutes.post["/etablissement/creation"].response["200"]
  type CreationResponse = z.output<typeof responseSchema>

  it("Vérifie que le recruteur est créé avec une offre", async () => {
    const response = await httpClient().inject({
      method: "POST",
      path: "/api/etablissement/creation",
      body: {
        email: "email@email.com",
        first_name: "John",
        last_name: "Doe",
        phone: "0612345678",
        establishment_siret: "42476141900045",
        origin: "lba",
        opco: OPCOS_LABEL.AKTO,
        idcc: "3248",
        type: ENTREPRISE,
      },
    })
    expect.soft(response.statusCode).toBe(200)
    const { formulaire, user } = response.json() as CreationResponse
    expect.soft(omit(formulaire, ["_id", "createdAt", "establishment_id", "managed_by", "updatedAt"])).toMatchSnapshot()
    expect.soft(omit(user, ["_id", "createdAt", "updatedAt", "last_action_date", "status"])).toMatchSnapshot()
    expect.soft(user.status[0].status).toBe(UserEventType.ACTIF)
  })

  it("Vérifie qu'une fois créé, l'opco n'est plus modifié par une autre création de compte", async () => {
    const response = await httpClient().inject({
      method: "POST",
      path: "/api/etablissement/creation",
      body: {
        email: "email@email.com",
        first_name: "John",
        last_name: "Doe",
        phone: "0612345678",
        establishment_siret: "42476141900045",
        origin: "lba",
        opco: OPCOS_LABEL.AKTO,
        idcc: "3248",
        type: ENTREPRISE,
      },
    })
    const { formulaire } = response.json() as CreationResponse
    expect.soft(formulaire?.opco).toBe(OPCOS_LABEL.AKTO)

    const response2 = await httpClient().inject({
      method: "POST",
      path: "/api/etablissement/creation",
      body: {
        email: "email2@email.com",
        first_name: "John",
        last_name: "Doe",
        phone: "0612345678",
        establishment_siret: "42476141900045",
        origin: "lba",
        opco: OPCOS_LABEL.CONSTRUCTYS,
        idcc: "3248",
        type: ENTREPRISE,
      },
    })
    const { formulaire: formulaire2 } = response2.json() as CreationResponse
    expect.soft(formulaire2?.opco).toBe(OPCOS_LABEL.AKTO)
  })
})
