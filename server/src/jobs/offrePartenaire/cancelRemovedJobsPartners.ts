import { Transform } from "stream"
import { pipeline } from "stream/promises"

import { ObjectId } from "mongodb"
import { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"

export const cancelRemovedJobsPartners = async () => {
  const cursor = await getDbCollection("computed_jobs_partners").find({ validated: true }).project({ _id: 0, validated: 0, errors: 0 }).stream()

  const transform = new Transform({
    objectMode: true,
    async transform(computedJobPartner: Omit<IJobsPartnersOfferPrivate, "_id" | "created_at">, encoding, callback: (error?: Error | null, data?: any) => void) {
      try {
        await getDbCollection("jobs_partners").updateOne(
          { partner_job_id: computedJobPartner.partner_job_id },
          {
            $set: { ...computedJobPartner },
            $setOnInsert: { _id: new ObjectId() },
          },
          { upsert: true }
        )
        callback(null)
      } catch (err: unknown) {
        err instanceof Error ? callback(err) : callback(new Error(String(err)))
      }
    },
  })

  await pipeline(cursor, transform)
}
