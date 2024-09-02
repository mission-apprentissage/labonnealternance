import { Transform } from "stream"
import { pipeline } from "stream/promises"

import { ObjectId } from "mongodb"
import { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"

export const importFromComputedToJobsPartners = async () => {
  const cursor = await getDbCollection("computed_jobs_partners").find({ validated: true }).project({ _id: -1, created_at: -1, updated_at: -1 }).stream()

  const transform = new Transform({
    objectMode: true,
    async transform(computedJobPartner: Omit<IJobsPartnersOfferPrivate, "_id" | "created_at">, encoding, callback: (error?: Error | null, data?: any) => void) {
      try {
        await getDbCollection("jobs_partners").updateOne(
          { partner_job_id: computedJobPartner.partner_job_id },
          {
            $set: { ...computedJobPartner },
            $setOnInsert: { _id: new ObjectId(), created_at: new Date() },
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

  // tests :

  // créations de plusieurs éléments existants dans jobs partners
  // création de plusieurs éléments dans computed jobs partners . certains avec validated true, d'autres false
  // certains éléments validated de computed sont déjà présents dans jobs partners

  // les éléments non validated ne doivent pas se retrouver dans jobs partners
  // les éléments validated et absents initialement de jobs partners doivent se rerouver dans jobs partners
  // les éléments validated et déjà dans jobs partners doivent toujours y être avec les data modifiées à jour
}
