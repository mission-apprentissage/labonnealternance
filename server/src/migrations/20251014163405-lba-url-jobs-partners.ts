import { Transform } from "node:stream"
import { pipeline } from "node:stream/promises"

import { AnyBulkWriteOperation } from "mongodb"
import { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { groupStreamData } from "@/common/utils/streamUtils"
import { buildUrlLba } from "@/jobs/offrePartenaire/importFromComputedToJobsPartners"

export const up = async () => {
  const collection = getDbCollection("jobs_partners")
  const cursor = collection.find({})

  const transform = new Transform({
    objectMode: true,
    async transform(chunk: IJobsPartnersOfferPrivate[], _encoding, callback) {
      const buffer: AnyBulkWriteOperation<IJobsPartnersOfferPrivate>[] = []

      chunk.forEach((job: IJobsPartnersOfferPrivate) => {
        buffer.push({
          updateOne: {
            filter: { _id: job._id },
            update: {
              $set: {
                lba_url: buildUrlLba(job.partner_label, job._id.toString(), job.workplace_siret, job.offer_title),
              },
            },
          },
        })
      })

      if (buffer.length > 0) {
        await collection.bulkWrite(buffer)
      }

      callback()
    },
  })

  await pipeline(cursor, groupStreamData({ size: 10_000 }), transform)
}

export const requireShutdown: boolean = true
