import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sanitizeTextField } from "@/common/utils/stringUtils"

export const up = async () => {
  const jobs = await getDbCollection("jobs_partners")
    .find(
      { $or: [{ workplace_description: { $ne: null } }, { workplace_name: { $ne: null } }] },
      { projection: { _id: 1, workplace_description: 1, workplace_name: 1, offer_description: 1, offer_title: 1 } }
    )
    .toArray()
  asyncForEach(jobs, async (job) => {
    const result = {
      workplace_description: sanitizeTextField(job.workplace_description, true),
      workplace_name: sanitizeTextField(job.workplace_name, true),
      offer_description: sanitizeTextField(job.offer_description, true),
      offer_title: sanitizeTextField(job.offer_title, true),
    }
    await getDbCollection("jobs_partners").updateOne({ _id: job._id }, { $set: result })
  })
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
