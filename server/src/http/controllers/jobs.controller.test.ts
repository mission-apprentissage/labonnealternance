import { ObjectId } from "mongodb"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/jobPartners.fixture"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"

describe("jobs.controller", () => {
  useMongo()
  const httpClient = useServer()

  describe("GET /v1/_private/jobs/min", () => {
    it("retourne 500 avec wrong_parameters si caller et romes sont absents", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/v1/_private/jobs/min" })

      expect(response.statusCode).toBe(500)
      expect(response.json().error).toBe("wrong_parameters")
    })

    it("retourne 200 avec la structure attendue pour des paramètres valides", async () => {
      const response = await httpClient().inject({
        method: "GET",
        path: "/api/v1/_private/jobs/min?romes=F1603&caller=test-caller",
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body).toHaveProperty("partnerJobs")
      expect(body).toHaveProperty("lbaJobs")
      expect(body).toHaveProperty("lbaCompanies")
    })
  })

  describe("GET /_private/jobs/:source/:id", () => {
    it("retourne 400 si la source est invalide", async () => {
      const response = await httpClient().inject({
        method: "GET",
        path: "/api/_private/jobs/source_invalide/someId",
      })

      expect(response.statusCode).toBe(400)
    })

    describe(`source: ${LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA}`, () => {
      it("retourne 404 si l'offre n'existe pas", async () => {
        const unknownId = new ObjectId().toString()
        const response = await httpClient().inject({
          method: "GET",
          path: `/api/_private/jobs/${LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA}/${unknownId}`,
        })

        expect(response.statusCode).toBe(404)
      })

      it("retourne 200 avec l'offre si elle existe", async () => {
        const job = generateJobsPartnersOfferPrivate({ partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA })
        await getDbCollection("jobs_partners").insertOne(job)

        const response = await httpClient().inject({
          method: "GET",
          path: `/api/_private/jobs/${LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA}/${job._id.toString()}`,
        })

        expect(response.statusCode).toBe(200)
        expect(response.json().id).toBe(job._id.toString())
      })
    })

    describe(`source: ${LBA_ITEM_TYPE.RECRUTEURS_LBA}`, () => {
      it("retourne 404 si l'entreprise n'existe pas", async () => {
        const response = await httpClient().inject({
          method: "GET",
          path: `/api/_private/jobs/${LBA_ITEM_TYPE.RECRUTEURS_LBA}/00000000000000`,
        })

        expect(response.statusCode).toBe(404)
      })

      it("retourne 200 avec l'entreprise si elle existe", async () => {
        const siret = "13002526500013"
        const company = generateJobsPartnersOfferPrivate({
          partner_label: LBA_ITEM_TYPE.RECRUTEURS_LBA,
          workplace_siret: siret,
        })
        await getDbCollection("jobs_partners").insertOne(company)

        const response = await httpClient().inject({
          method: "GET",
          path: `/api/_private/jobs/${LBA_ITEM_TYPE.RECRUTEURS_LBA}/${siret}`,
        })

        expect(response.statusCode).toBe(200)
        expect(response.json().company.siret).toBe(siret)
      })
    })
  })

  describe("POST /v1/jobs/matcha/:id/stats/view-details", () => {
    it("retourne 400 si l'id n'est pas un ObjectId valide", async () => {
      const response = await httpClient().inject({
        method: "POST",
        path: "/api/v1/jobs/matcha/pas-un-object-id/stats/view-details",
      })

      expect(response.statusCode).toBe(400)
    })

    it("retourne 200 avec un objet vide pour un ObjectId valide", async () => {
      const validId = new ObjectId().toString()

      const response = await httpClient().inject({
        method: "POST",
        path: `/api/v1/jobs/matcha/${validId}/stats/view-details`,
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({})
    })
  })
})
