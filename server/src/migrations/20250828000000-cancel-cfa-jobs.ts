import { JOB_STATUS_ENGLISH } from "shared"

import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { isCompanyInBlockedCfaList } from "@/jobs/offrePartenaire/isCompanyInBlockedCfaList"

export const up = async () => {
  const jobs = await getDbCollection("jobs_partners")
    .find({ partner_label: { $ne: "recruteurs_lba" }, offer_status: JOB_STATUS_ENGLISH.ACTIVE }, { projection: { workplace_name: 1, _id: 1 } })
    .toArray()
  await asyncForEach(jobs, async (job) => {
    if (job.workplace_name) {
      const isBlocked = isCompanyInBlockedCfaList(job.workplace_name)
      if (isBlocked) {
        await getDbCollection("jobs_partners").updateOne({ _id: job._id }, { $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE } })
      }
    }
  })
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
