import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  const now = new Date()
  const startTime = new Date("2025-01-01T00:00:00.000Z")

  const jobsIds = await getDbCollection("jobs_partners").distinct("_id", {
    offer_desired_skills: [],
    offer_to_be_acquired_knowledge: [],
    offer_to_be_acquired_skills: [],
    partner_label: "offres_emploi_lba",
    created_at: { $gte: startTime },
  })

  // déclenchera le change stream pour les jobs concernés
  await getDbCollection("recruiters").updateMany({ _id: { $in: jobsIds } }, { $set: { updatedAt: now } })
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
