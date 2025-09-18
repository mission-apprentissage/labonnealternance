import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("jobs_partners").updateMany(
    { "offer_target_diploma.label": "Licence, Maîtrise, autres formations niveaux 6 (Bac+3 à Bac+4)" },
    { $set: { "offer_target_diploma.label": "Licence, Maîtrise, autres formations niveau (Bac+3 à Bac+4)" } }
  )

  const recruiters = await getDbCollection("recruiters").find({ "jobs.job_level_label": "Licence, Maîtrise, autres formations niveaux 6 (Bac+3 à Bac+4)" }).toArray()

  await asyncForEach(recruiters, async (recruiter) => {
    const { jobs } = recruiter
    const jobsToUpdate = jobs.map((job) => {
      // @ts-ignore
      if (job.job_level_label === "Licence, Maîtrise, autres formations niveaux 6 (Bac+3 à Bac+4)") {
        return {
          ...job,
          job_level_label: "Licence, Maîtrise, autres formations niveau (Bac+3 à Bac+4)",
        }
      }
      return job
    })
    // @ts-ignore
    await getDbCollection("recruiters").updateOne({ _id: recruiter._id }, { $set: { jobs: jobsToUpdate } })
  })
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
