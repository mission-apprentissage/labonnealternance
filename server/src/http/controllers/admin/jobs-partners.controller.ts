import { badRequest, notFound } from "@hapi/boom"
import type { Filter } from "mongodb"
import { ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH, zRoutes } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import type { IJobsPartnersOfferForAdmin, IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { jobPartnersExcludedFromFlux } from "shared/models/jobs-partners.model"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import type { Server } from "@/http/server"
import { getUserFromRequest } from "@/security/authentication.service"
import { updateClassificationAndSynchronise } from "@/services/cache-classification.service"
import { buildLbaUrl } from "@/services/jobs/job-opportunity/job-opportunity.service"
import { syncJobPartnersToSearchItemsInBackground } from "@/services/search/search-items.service"

export default (server: Server) => {
  server.get(
    "/admin/jobs-partners",
    {
      schema: zRoutes.get["/admin/jobs-partners"],
      onRequest: server.auth(zRoutes.get["/admin/jobs-partners"]),
    },
    async (req, res) => {
      const { partner_label, offer_status, id, limit = 50, offset = 0 } = req.query

      const match: Filter<IJobsPartnersOfferPrivate> = {
        partner_label: { $nin: jobPartnersExcludedFromFlux, ...(partner_label ? { $in: partner_label } : {}) },
      }
      if (offer_status) {
        match.offer_status = { $in: offer_status }
      }
      if (id) {
        if (!ObjectId.isValid(id)) {
          throw badRequest("id invalide")
        }
        match._id = new ObjectId(id)
      }

      const [{ data, totalCount }] = await getDbCollection("jobs_partners")
        .aggregate<{ data: IJobsPartnersOfferForAdmin[]; totalCount: [{ count: number }] | [] }>([
          { $match: match },
          {
            $lookup: {
              from: "cache_classification",
              let: { partner_job_id: "$partner_job_id", partner_label: "$partner_label" },
              pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$partner_job_id", "$$partner_job_id"] }, { $eq: ["$partner_label", "$$partner_label"] }] } } }],
              as: "classificationEntry",
            },
          },
          {
            $facet: {
              data: [
                { $sort: { offer_creation: -1 } },
                { $skip: offset },
                { $limit: limit },
                {
                  $project: {
                    _id: 1,
                    partner_label: 1,
                    partner_job_id: 1,
                    offer_title: 1,
                    offer_status: 1,
                    offer_creation: 1,
                    offer_expiration: 1,
                    workplace_name: 1,
                    workplace_legal_name: 1,
                    workplace_siret: 1,
                    workplace_address_city: 1,
                    is_delegated: 1,
                    cfa_legal_name: 1,
                    cfa_siret: 1,
                    created_at: 1,
                    updated_at: 1,
                    classification: {
                      $let: {
                        vars: { entry: { $arrayElemAt: ["$classificationEntry", 0] } },
                        in: {
                          $cond: [
                            { $eq: ["$$entry", null] },
                            null,
                            { model: { $ifNull: ["$$entry.classification", null] }, human_verification: { $ifNull: ["$$entry.human_verification", null] } },
                          ],
                        },
                      },
                    },
                  },
                },
              ],
              totalCount: [{ $count: "count" }],
            },
          },
        ])
        .toArray()

      // Toujours reconstruite ici (pas de valeur stockée) : jobs_partners.lba_url est calculé au moment de l'écriture
      // avec le config.publicUrl de l'environnement qui a tourné le job fill-lba-url, qui peut différer de l'environnement courant.
      const jobs = data.map((job) => ({
        ...job,
        lba_url: buildLbaUrl(LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES, job._id, job.workplace_siret, job.offer_title),
      }))

      return res.status(200).send({
        jobs,
        pagination: { total: totalCount[0]?.count ?? 0, limit, offset },
      })
    }
  )

  server.post(
    "/admin/jobs-partners/:id/activate",
    {
      schema: zRoutes.post["/admin/jobs-partners/:id/activate"],
      onRequest: server.auth(zRoutes.post["/admin/jobs-partners/:id/activate"]),
    },
    async (req, res) => {
      const { id } = req.params
      const job = await getDbCollection("jobs_partners").findOne({ _id: id })
      if (!job) throw notFound("Offre introuvable")
      if (job.offer_status === JOB_STATUS_ENGLISH.ACTIVE) throw badRequest("L'offre est déjà active")

      const requestUser = getUserFromRequest(req, zRoutes.post["/admin/jobs-partners/:id/activate"]).value

      await getDbCollection("jobs_partners").updateOne(
        { _id: id },
        {
          $set: { offer_status: JOB_STATUS_ENGLISH.ACTIVE, updated_at: new Date() },
          $push: {
            offer_status_history: {
              date: new Date(),
              status: JOB_STATUS_ENGLISH.ACTIVE,
              reason: "réactivation manuelle par un administrateur",
              granted_by: requestUser.email,
            },
          },
        }
      )
      syncJobPartnersToSearchItemsInBackground([id])
      return res.status(200).send({})
    }
  )

  server.post(
    "/admin/jobs-partners/:id/deactivate",
    {
      schema: zRoutes.post["/admin/jobs-partners/:id/deactivate"],
      onRequest: server.auth(zRoutes.post["/admin/jobs-partners/:id/deactivate"]),
    },
    async (req, res) => {
      const { id } = req.params
      const { reason } = req.body
      const job = await getDbCollection("jobs_partners").findOne({ _id: id })
      if (!job) throw notFound("Offre introuvable")
      if (job.offer_status === JOB_STATUS_ENGLISH.ANNULEE) throw badRequest("L'offre est déjà désactivée")

      const requestUser = getUserFromRequest(req, zRoutes.post["/admin/jobs-partners/:id/deactivate"]).value

      await getDbCollection("jobs_partners").updateOne(
        { _id: id },
        {
          $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE, updated_at: new Date() },
          $push: {
            offer_status_history: {
              date: new Date(),
              status: JOB_STATUS_ENGLISH.ANNULEE,
              reason,
              granted_by: requestUser.email,
            },
          },
        }
      )
      syncJobPartnersToSearchItemsInBackground([id])
      return res.status(200).send({})
    }
  )

  server.post(
    "/admin/jobs-partners/:id/classification",
    {
      schema: zRoutes.post["/admin/jobs-partners/:id/classification"],
      onRequest: server.auth(zRoutes.post["/admin/jobs-partners/:id/classification"]),
    },
    async (req, res) => {
      const { id } = req.params
      const { classification } = req.body
      const job = await getDbCollection("jobs_partners").findOne({ _id: id }, { projection: { partner_job_id: 1 } })
      if (!job) throw notFound("Offre introuvable")

      const existingEntry = await getDbCollection("cache_classification").findOne({ partner_job_id: job.partner_job_id })
      if (!existingEntry) {
        return res.status(200).send({ updated: false })
      }

      await updateClassificationAndSynchronise({ classification, partner_job_ids: [job.partner_job_id] })
      return res.status(200).send({ updated: true })
    }
  )
}
