import { unauthorized } from "@hapi/boom"
import type { ICredential } from "shared"
import { zRoutes } from "shared"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import type { Server } from "@/http/server"

type IModelTraining = {
  partner_job_id: string
  label: string
  workplace_name: string
  workplace_description: string
  offer_title: string
  offer_description: string
  human_verified: boolean
}

export const classificationRoutes = (server: Server) => {
  server.get("/classification", { schema: zRoutes.get["/classification"], onRequest: server.auth(zRoutes.get["/classification"]) }, async (req, res) => {
    const user = req.user?.value as ICredential
    if (user.scope !== "classification") throw unauthorized("scope classification required")
    const resultCacheClassification = (await getDbCollection("cache_classification")
      .aggregate([
        {
          $match: {
            human_verification: { $nin: [null, ""] },
          },
        },
        {
          $lookup: {
            from: "jobs_partners",
            localField: "partner_job_id",
            foreignField: "partner_job_id",
            as: "job",
          },
        },
        { $unwind: "$job" },
        {
          $project: {
            _id: 0,
            partner_job_id: 1,
            label: "$human_verification",
            workplace_name: "$job.workplace_name",
            workplace_description: "$job.workplace_description",
            offer_title: "$job.offer_title",
            offer_description: "$job.offer_description",
            human_verified: { $literal: true },
          },
        },
      ])
      .toArray()) as IModelTraining[]

    const resultCacheClassificationPublished = (await getDbCollection("cache_classification")
      .aggregate([
        { $match: { "scores.publish": 1, classification: "publish", human_verification: { $in: [null, ""] } } },
        { $limit: 25_000 },
        {
          $lookup: {
            from: "jobs_partners",
            localField: "partner_job_id",
            foreignField: "partner_job_id",
            as: "job",
          },
        },
        { $unwind: "$job" },
        {
          $project: {
            _id: 0,
            partner_job_id: 1,
            label: { $literal: "publish" },
            workplace_name: "$job.workplace_name",
            workplace_description: "$job.workplace_description",
            offer_title: "$job.offer_title",
            offer_description: "$job.offer_description",
            human_verified: { $literal: false },
          },
        },
      ])
      .toArray()) as IModelTraining[]

    const resultComputedBlacklisted = await getDbCollection("computed_jobs_partners")
      .find(
        { business_error: JOB_PARTNER_BUSINESS_ERROR.CFA_BLACKLISTED },
        { projection: { workplace_name: 1, workplace_description: 1, offer_title: 1, offer_description: 1, partner_job_id: 1, _id: 0 } }
      )
      .toArray()

    const deduplicatedResults = new Map<string, IModelTraining>(resultCacheClassification.map((result) => [result.partner_job_id, result]))

    for (const { partner_job_id, workplace_name, workplace_description, offer_title, offer_description } of resultComputedBlacklisted) {
      if (!deduplicatedResults.has(partner_job_id)) {
        deduplicatedResults.set(partner_job_id, {
          partner_job_id,
          label: "unpublish",
          workplace_name: workplace_name || "",
          workplace_description: workplace_description || "",
          offer_title: offer_title || "",
          offer_description: offer_description || "",
          human_verified: false,
        })
      }
    }

    for (const result of resultCacheClassificationPublished) {
      if (!deduplicatedResults.has(result.partner_job_id)) {
        deduplicatedResults.set(result.partner_job_id, {
          ...result,
          workplace_name: result.workplace_name || "",
          workplace_description: result.workplace_description || "",
          offer_title: result.offer_title || "",
          offer_description: result.offer_description || "",
        })
      }
    }

    return res.status(200).send(Array.from(deduplicatedResults.values()).map(({ partner_job_id: _partner_job_id, ...result }) => result))
  })
}
