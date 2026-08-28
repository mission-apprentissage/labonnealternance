import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { ObjectId } from "mongodb"
import { LBA_ITEM_TYPE, UNKNOWN_COMPANY } from "shared/constants/lbaitem"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"

describe("jobs.controller", () => {
  useMongo()
  const httpClient = useServer()

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

    describe(`source: ${LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES}`, () => {
      it("retourne la raison sociale quand workplace_name est une chaîne vide", async () => {
        // Faux positif du `??` : "" n'est pas nullish, la fiche détail affichait un employeur vide
        // alors que la carte de résultat (buildJobOfferSearchItem, en `||`) affichait bien le nom.
        const job = generateJobsPartnersOfferPrivate({
          partner_label: "Mission Apprentissage",
          workplace_name: "",
          workplace_brand: null,
          workplace_legal_name: "DIRECTION INTERMINISTERIELLE DU NUMERIQUE",
        })
        await getDbCollection("jobs_partners").insertOne(job)

        const response = await httpClient().inject({
          method: "GET",
          path: `/api/_private/jobs/${LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES}/${job._id.toString()}`,
        })

        expect.soft(response.statusCode).toBe(200)
        expect.soft(response.json().company.name).toBe("DIRECTION INTERMINISTERIELLE DU NUMERIQUE")
      })

      it("retourne le nom par défaut quand tous les noms sont vides ou absents", async () => {
        const job = generateJobsPartnersOfferPrivate({
          partner_label: "Mission Apprentissage",
          workplace_name: "",
          workplace_brand: "",
          workplace_legal_name: null,
        })
        await getDbCollection("jobs_partners").insertOne(job)

        const response = await httpClient().inject({
          method: "GET",
          path: `/api/_private/jobs/${LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES}/${job._id.toString()}`,
        })

        expect.soft(response.statusCode).toBe(200)
        expect.soft(response.json().company.name).toBe(UNKNOWN_COMPANY)
      })

      it("privilégie workplace_name quand il est renseigné", async () => {
        const job = generateJobsPartnersOfferPrivate({
          partner_label: "Mission Apprentissage",
          workplace_name: "Nom customisé",
          workplace_brand: "Enseigne",
          workplace_legal_name: "Raison sociale",
        })
        await getDbCollection("jobs_partners").insertOne(job)

        const response = await httpClient().inject({
          method: "GET",
          path: `/api/_private/jobs/${LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES}/${job._id.toString()}`,
        })

        expect.soft(response.statusCode).toBe(200)
        expect.soft(response.json().company.name).toBe("Nom customisé")
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
