import { ObjectId } from "mongodb"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { validateSIRET } from "shared/validators/siretValidator"

import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { getReportAdditionalInfos } from "@/services/reportedCompany.service"

export const up = async () => {
  const missingDataReportedCompanies = await getDbCollection("reported_companies").find({ partnerLabel: null }).toArray()
  await asyncForEach(missingDataReportedCompanies, async (reportedCompany) => {
    const { itemId, _id, type } = reportedCompany
    const jobPartner = await getDbCollection("jobs_partners").findOne({ partner_job_id: itemId })
    if (jobPartner) {
      console.info(`updating partner label for reported company with itemId=${itemId}`)
      await getDbCollection("reported_companies").updateOne({ _id }, { $set: { partnerLabel: jobPartner.partner_label } })
      return
    }
    const isSiret = validateSIRET(itemId)
    if (!isSiret && !ObjectId.isValid(itemId)) {
      return
    }
    const finalType = isSiret ? LBA_ITEM_TYPE.RECRUTEURS_LBA : type
    const addedInfos = await getReportAdditionalInfos(itemId, finalType)
    if (addedInfos) {
      console.info(`updating additional infos for jobs partner with itemId=${itemId} and type=${type}`)
      await getDbCollection("reported_companies").updateOne({ _id }, { $set: { ...addedInfos, type: finalType } })
      return
    }
    console.warn(`could not update reported company with itemId=${itemId}`)
    return
  })
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
