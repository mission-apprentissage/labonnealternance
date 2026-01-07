import type { ICredential } from "shared"
import { JOB_STATUS_ENGLISH, zRoutes } from "shared"

import { addJob } from "job-processor"
import { unauthorized } from "@hapi/boom"
import type { Server } from "@/http/server"
import { getDbCollection } from "@/common/utils/mongodbUtils"

type IModelTraining = {
  label: string
  workplace_name: string
  workplace_description: string
  offer_title: string
  offer_description: string
}

export const classificationRoutes = (server: Server) => {
  server.get("/classification", { schema: zRoutes.get["/classification"] }, async (_, res) => {
    const result = (await getDbCollection("cache_classification")
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
            label: "$human_verification",
            workplace_name: "$job.workplace_name",
            workplace_description: "$job.workplace_description",
            offer_title: "$job.offer_title",
            offer_description: "$job.offer_description",
          },
        },
      ])
      .toArray()) as IModelTraining[]

    return res.status(200).send(result)
  })

  server.post("/classification", { schema: zRoutes.post["/classification"], onRequest: server.auth(zRoutes.post["/classification"]) }, async (req, res) => {
    const user = req.user?.value as ICredential
    if (user.scope !== "classification") throw unauthorized("scope classification required")
    const { classification, partner_job_ids } = req.body
    await updateClassificationAndSynchronise({ classification, partner_job_ids })
    return res.status(200).send({ response: "Les mises à jour vont être traité par le serveur", time: new Date() })
  })
}

const updateClassificationAndSynchronise = async ({ classification, partner_job_ids }: { classification: "cfa" | "entreprise" | "entreprise_cfa"; partner_job_ids: string[] }) => {
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
        getDbCollection("jobs_partners").updateOne({ partner_job_id: job.partner_job_id }, { $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE, updated_at: new Date() } }),
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
