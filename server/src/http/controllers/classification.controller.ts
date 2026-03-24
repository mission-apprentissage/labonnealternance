import { unauthorized } from "@hapi/boom"
import { addJob } from "job-processor"
import type { ICredential } from "shared"
import { JOB_STATUS_ENGLISH, zRoutes } from "shared"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import type { Server } from "@/http/server"

type IModelTraining = {
  partner_job_id: string
  label: string
  workplace_name: string
  workplace_description: string
  offer_title: string
  offer_description: string
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
        })
      }
    }

    return res.status(200).send(Array.from(deduplicatedResults.values()).map(({ partner_job_id: _partner_job_id, ...result }) => result))
  })

  server.post("/classification", { schema: zRoutes.post["/classification"], onRequest: server.auth(zRoutes.post["/classification"]) }, async (req, res) => {
    const user = req.user?.value as ICredential
    if (user.scope !== "classification") throw unauthorized("scope classification required")
    const { classification, partner_job_ids } = req.body
    await updateClassificationAndSynchronise({ classification, partner_job_ids })
    return res.status(200).send({ response: "Les mises à jour vont être traité par le serveur", time: new Date() })
  })
}

const updateClassificationAndSynchronise = async ({ classification, partner_job_ids }: { classification: "publish" | "unpublish"; partner_job_ids: string[] }) => {
  // update cache_classification
  await getDbCollection("cache_classification").updateMany({ partner_job_id: { $in: partner_job_ids } }, { $set: { human_verification: classification } })
  // get jobs_partners to update offer_status to annulé if classification !== human_verification
  const scopeToUpdate = await getDbCollection("cache_classification")
    .find({ partner_job_id: { $in: partner_job_ids } }, { projection: { partner_job_id: 1, classification: 1, human_verification: 1 } })
    .toArray()
  // filter scopeToUpdate to keep only the jobs where classification !== human_verification
  const filteredScope = scopeToUpdate.filter(({ classification, human_verification }) => classification !== human_verification)
  const filteredScopeIds = filteredScope.map(({ partner_job_id }) => partner_job_id)

  for await (const job of filteredScope) {
    const jobPartners = await getDbCollection("jobs_partners").findOne({ partner_job_id: job.partner_job_id })
    if (jobPartners) {
      await Promise.all([
        getDbCollection("jobs_partners").updateOne(
          { partner_job_id: job.partner_job_id },
          {
            $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE, updated_at: new Date() },
            $push: {
              offer_status_history: {
                date: new Date(),
                status: JOB_STATUS_ENGLISH.ANNULEE,
                reason: "classification humaine non conforme",
                granted_by: "classification.controller",
              },
            },
          }
        ),
        getDbCollection("computed_jobs_partners").updateOne({ partner_job_id: job.partner_job_id }, { $set: { business_error: null, errors: [], validated: false } }),
      ])
    } else {
      const computedJobPartner = await getDbCollection("computed_jobs_partners").findOne({ partner_job_id: job.partner_job_id })
      if (computedJobPartner) {
        await getDbCollection("computed_jobs_partners").updateOne({ partner_job_id: job.partner_job_id }, { $set: { business_error: null, errors: [], validated: false } })
      }
    }
  }
  // add job to fillComputedJobsPartners with the filteredScopeIds
  await addJob({ name: "fillComputedJobsPartners", payload: { addedMatchFilter: { partner_job_id: { $in: filteredScopeIds } } } })
  await addJob({ name: "importFromComputedToJobsPartners", payload: { partner_job_id: { $in: filteredScopeIds } } })
}
