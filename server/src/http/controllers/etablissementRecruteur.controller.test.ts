import { omit } from "lodash-es"
import nock from "nock"
import { CFA, ENTREPRISE, OPCOS_LABEL } from "shared/constants/index"
import { z } from "shared/helpers/zodWithOpenApi"
import { UserEventType } from "shared/models/index"
import { zRoutes } from "shared/routes/index"
import { beforeEach, describe, expect, it } from "vitest"

import { apiEntrepriseEtablissementFixture } from "@/common/apis/apiEntreprise/apiEntreprise.client.fixture"
import { apiReferentielCatalogueFixture } from "@/common/apis/apiReferentielCatalogue.fixture"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { saveUserWithAccount } from "@tests/utils/user.test.utils"

describe("POST /etablissement/creation", () => {
  useMongo()
  const httpClient = useServer()

  beforeEach(async () => {
    const mockEntreprise = nock("https://entreprise.api.gouv.fr/v3/insee")
      .persist()
      .get(new RegExp("/sirene/etablissements/diffusibles/", "g"))
      .reply(200, apiEntrepriseEtablissementFixture.dinum)

    const mockCfa = nock("https://referentiel.apprentissage.beta.gouv.fr").persist().get(new RegExp("/api/v1/organismes/[0-9]+", "g")).reply(200, apiReferentielCatalogueFixture)

    return async () => {
      mockEntreprise.persist(false)
      mockCfa.persist(false)
      await getDbCollection("recruiters").deleteMany()
      await getDbCollection("rolemanagements").deleteMany()
      await getDbCollection("entreprises").deleteMany()
      await getDbCollection("cfas").deleteMany()
      await getDbCollection("userswithaccounts").deleteMany()
    }
  })

  const bodySchema = zRoutes.post["/etablissement/creation"].body
  type CreationBody = z.output<typeof bodySchema>
  const responseSchema = zRoutes.post["/etablissement/creation"].response["200"]
  type CreationResponse = z.output<typeof responseSchema>

  const defaultCreationEntreprisePayload = {
    email: "email@email.com",
    first_name: "John",
    last_name: "Doe",
    phone: "0612345678",
    establishment_siret: "42476141900045",
    origin: "lba",
    opco: OPCOS_LABEL.AKTO,
    idcc: "3248",
    type: ENTREPRISE,
  } as const

  const defaultCreationCFAPayload = {
    opco: null,
    email: "email@email.com",
    first_name: "John",
    last_name: "Doe",
    phone: "0612345678",
    origin: "lba",
    type: CFA,
    establishment_siret: "52151363000017",
  } as const

  const callCreation = (body: CreationBody) =>
    httpClient().inject({
      method: "POST",
      path: "/api/etablissement/creation",
      body,
    })

  describe("Création d'entreprise", () => {
    it("Vérifie que le recruteur est créé avec une offre", async () => {
      const response = await callCreation(defaultCreationEntreprisePayload)
      expect.soft(response.statusCode).toBe(200)
      const { formulaire, user } = response.json() as CreationResponse
      expect.soft(omit(formulaire, ["_id", "createdAt", "establishment_id", "managed_by", "updatedAt"])).toMatchSnapshot()
      expect.soft(omit(user, ["_id", "createdAt", "updatedAt", "last_action_date", "status"])).toMatchSnapshot()
      expect.soft(user.status[0].status).toBe(UserEventType.ACTIF)
    }, 10_000)

    it("Vérifie qu'une fois créé, l'opco n'est plus modifié par une autre création de compte", async () => {
      const response = await callCreation(defaultCreationEntreprisePayload)
      const { formulaire } = response.json() as CreationResponse
      expect.soft(formulaire?.opco).toBe(OPCOS_LABEL.AKTO)

      const response2 = await callCreation({
        ...defaultCreationEntreprisePayload,
        email: "email2@email.com",
        opco: OPCOS_LABEL.CONSTRUCTYS,
      })
      const { formulaire: formulaire2 } = response2.json() as CreationResponse
      expect.soft(formulaire2?.opco).toBe(OPCOS_LABEL.AKTO)
    })

    it("Vérifie qu'un email ne peut pas créer plusieurs comptes", async () => {
      const response = await callCreation(defaultCreationEntreprisePayload)
      const { formulaire } = response.json() as CreationResponse
      expect.soft(formulaire?.opco).toBe(OPCOS_LABEL.AKTO)

      const response2 = await callCreation({
        ...defaultCreationEntreprisePayload,
        establishment_siret: "48755980900016",
      })
      expect.soft(response2.statusCode).toBe(403)
      expect.soft(response2.json().message).toBe("L'adresse mail est déjà associée à un compte La bonne alternance.")
    })
    it("Vérifie qu'un email ne peut pas créer un compte si l utilisateur existe déjà", async () => {
      // given
      const { email } = defaultCreationEntreprisePayload
      await saveUserWithAccount({ email })
      // when
      const response = await callCreation({ ...defaultCreationEntreprisePayload, email })
      // then
      expect.soft(response.statusCode).toBe(403)
      expect.soft(response.json().message).toBe("L'adresse mail est déjà associée à un compte La bonne alternance.")
    })
  })
  describe("Création de CFA", () => {
    it("Vérifie que le CFA est créé", async () => {
      const response = await callCreation(defaultCreationCFAPayload)
      expect.soft(response.statusCode).toBe(200)
      const { formulaire, user } = response.json() as CreationResponse
      expect.soft(formulaire).not.toBeDefined()
      expect.soft(omit(user, ["_id", "createdAt", "updatedAt", "last_action_date", "status"])).toMatchSnapshot()
      expect.soft(user.status[0].status).toBe(UserEventType.ACTIF)
    })
    it("Vérifie qu un email ne peut pas créer 2 comptes CFA", async () => {
      const response = await callCreation(defaultCreationCFAPayload)
      expect.soft(response.statusCode).toBe(200)
      const response2 = await callCreation({ ...defaultCreationCFAPayload, establishment_siret: "13002172800261" })
      expect.soft(response2.statusCode).toBe(403)
      expect.soft(response2.json().message).toBe("L'adresse mail est déjà associée à un compte La bonne alternance.")
    })
    it("Vérifie que 2 emails ne peuvent pas avoir un compte sur le même CFA", async () => {
      const response = await callCreation(defaultCreationCFAPayload)
      expect.soft(response.statusCode).toBe(200)
      const response2 = await callCreation({ ...defaultCreationCFAPayload, email: "email2@email.fr" })
      expect.soft(response2.statusCode).toBe(403)
      expect.soft(response2.json().message).toBe("Ce numéro siret est déjà associé à un compte utilisateur.")
    })
    it("Vérifie qu'un email ne peut pas créer un compte si l utilisateur existe déjà", async () => {
      // given
      const { email } = defaultCreationCFAPayload
      await saveUserWithAccount({ email })
      // when
      const response = await callCreation({ ...defaultCreationCFAPayload, email })
      // then
      expect.soft(response.statusCode).toBe(403)
      expect.soft(response.json().message).toBe("L'adresse mail est déjà associée à un compte La bonne alternance.")
    })
  })
  describe("ENTREPRISE / CFA", () => {
    it("Vérifie que un email ne peut pas créer un compte entreprise puis un compte CFA", async () => {
      const email = defaultCreationEntreprisePayload.email
      const response = await callCreation({ ...defaultCreationEntreprisePayload, email })
      expect.soft(response.statusCode).toBe(200)
      const response2 = await callCreation({ ...defaultCreationCFAPayload, email })
      expect.soft(response2.statusCode).toBe(403)
      expect.soft(response2.json().message).toBe("L'adresse mail est déjà associée à un compte La bonne alternance.")
    })
    it("Vérifie que un email ne peut pas créer un compte CFA puis un compte entreprise", async () => {
      const email = defaultCreationEntreprisePayload.email
      const response = await callCreation({ ...defaultCreationCFAPayload, email })
      expect.soft(response.statusCode).toBe(200)
      const response2 = await callCreation({ ...defaultCreationEntreprisePayload, email })
      expect.soft(response2.statusCode).toBe(403)
      expect.soft(response2.json().message).toBe("L'adresse mail est déjà associée à un compte La bonne alternance.")
    })
  })
})
