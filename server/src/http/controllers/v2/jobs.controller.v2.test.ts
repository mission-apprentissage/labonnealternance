import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { saveUserWithAccount } from "@tests/utils/user.test.utils"
import { ObjectId } from "mongodb"
import { JOB_CLOSURE_ORIGIN, JOB_STATUS_ENGLISH, zRoutes } from "shared"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { generateAccessToken, generateScope, userWithAccountToUserForToken } from "@/security/access-token.service"

vi.mock("@/services/search/search-items.service", () => ({
  syncJobPartnersToSearchItemsInBackground: vi.fn(),
}))

useMongo()
const httpClient = useServer()

/**
 * Ces deux routes closent une offre d'un partenaire de flux depuis le lien reçu par mail : le jeton est signé par
 * createCancelJobLink / createProvidedJobLink et porte le scope de la route plus l'id de l'offre.
 * Malgré le préfixe v2, ce n'est pas une API ouverte aux partenaires — d'où un `granted_by` qui
 * nomme le canal réel et non le contrôleur (issue #5429).
 */
describe("jobs.controller.v2 — clôture depuis un lien de mail", () => {
  const insertOffer = async (offer_status: JOB_STATUS_ENGLISH) => {
    const job = generateJobsPartnersOfferPrivate({
      partner_label: JOBPARTNERS_LABEL.HELLOWORK,
      offer_status,
      offer_status_history: [],
    })
    await getDbCollection("jobs_partners").insertOne(job)
    return job._id
  }

  const tokenFor = async (schema: Parameters<typeof generateScope>[0]["schema"], id: ObjectId) => {
    const user = await saveUserWithAccount()
    return generateAccessToken(userWithAccountToUserForToken(user), [generateScope({ schema, options: { params: { id: id.toString() }, querystring: undefined } })])
  }

  const call = async (path: string, token: string) => httpClient().inject({ method: "POST", url: path, headers: { authorization: `Bearer ${token}` } })

  const readOffer = async (id: ObjectId) => {
    const job = await getDbCollection("jobs_partners").findOne({ _id: id })
    if (!job) throw new Error(`offre ${id} introuvable`)
    return job
  }

  describe("POST /v2/_private/jobs/canceled/:id", () => {
    const schema = zRoutes.post["/v2/_private/jobs/canceled/:id"]

    it("annule l'offre et trace l'action du recruteur", async () => {
      const id = await insertOffer(JOB_STATUS_ENGLISH.ACTIVE)

      const response = await call(`/api/v2/_private/jobs/canceled/${id}`, await tokenFor(schema, id))

      expect.soft(response.statusCode).toBe(200)
      const job = await readOffer(id)
      expect.soft(job.offer_status).toEqual(JOB_STATUS_ENGLISH.ANNULEE)
      expect.soft(job.offer_status_history).toEqual([
        expect.objectContaining({
          status: JOB_STATUS_ENGLISH.ANNULEE,
          reason: "offre annulée par le recruteur",
          granted_by: JOB_CLOSURE_ORIGIN.MAIL_RECRUTEUR,
        }),
      ])
      // Le $set et la trace partagent l'horodatage du constructeur.
      expect.soft(job.offer_status_history[0].date).toEqual(job.updated_at)
    })

    it("refuse une offre déjà annulée sans rien écrire", async () => {
      const id = await insertOffer(JOB_STATUS_ENGLISH.ANNULEE)

      const response = await call(`/api/v2/_private/jobs/canceled/${id}`, await tokenFor(schema, id))

      expect.soft(response.statusCode).toBe(400)
      expect.soft((await readOffer(id)).offer_status_history).toEqual([])
    })

    it("rejette un jeton signé pour une autre offre", async () => {
      const id = await insertOffer(JOB_STATUS_ENGLISH.ACTIVE)

      const response = await call(`/api/v2/_private/jobs/canceled/${id}`, await tokenFor(schema, new ObjectId()))

      // 403 et non 401 : le jeton est valide, c'est son scope qui ne couvre pas cette offre.
      expect.soft(response.statusCode).toBe(403)
      expect.soft((await readOffer(id)).offer_status).toEqual(JOB_STATUS_ENGLISH.ACTIVE)
    })
  })

  describe("POST /v2/_private/jobs/provided/:id", () => {
    const schema = zRoutes.post["/v2/_private/jobs/provided/:id"]

    it("passe l'offre en pourvue et trace l'action du recruteur", async () => {
      const id = await insertOffer(JOB_STATUS_ENGLISH.ACTIVE)

      const response = await call(`/api/v2/_private/jobs/provided/${id}`, await tokenFor(schema, id))

      expect.soft(response.statusCode).toBe(200)
      const job = await readOffer(id)
      expect.soft(job.offer_status).toEqual(JOB_STATUS_ENGLISH.POURVUE)
      expect.soft(job.offer_status_history).toEqual([
        expect.objectContaining({
          status: JOB_STATUS_ENGLISH.POURVUE,
          reason: "offre déclarée pourvue par le recruteur",
          granted_by: JOB_CLOSURE_ORIGIN.MAIL_RECRUTEUR,
        }),
      ])
    })

    it("refuse une offre déjà pourvue sans rien écrire", async () => {
      const id = await insertOffer(JOB_STATUS_ENGLISH.POURVUE)

      const response = await call(`/api/v2/_private/jobs/provided/${id}`, await tokenFor(schema, id))

      expect.soft(response.statusCode).toBe(400)
      expect.soft((await readOffer(id)).offer_status_history).toEqual([])
    })
  })
})
