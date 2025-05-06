import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { validateSIRET } from "shared/validators/siretValidator"

import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { getReportAdditionalInfos } from "@/services/reportedCompany.service"

export const up = async () => {
  const missingDataRecruteursLba = await getDbCollection("reported_companies").find({ type: LBA_ITEM_TYPE.RECRUTEURS_LBA, siret: null }).toArray()
  await asyncForEach(missingDataRecruteursLba, async (reportedCompany) => {
    const { itemId, type, _id } = reportedCompany
    const addedInfos = await getReportAdditionalInfos(itemId, type)
    if (!addedInfos) {
      console.warn(`could not find additional infos for reported company with itemId=${itemId} and type=${type}`)
      return
    }
    console.info(`updating additional infos for reported company with itemId=${itemId} and type=${type}`)
    await getDbCollection("reported_companies").updateOne({ _id }, { $set: addedInfos })
  })

  const missingDataPartenaires = await getDbCollection("reported_companies").find({ type: LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES, siret: null }).toArray()
  await asyncForEach(missingDataPartenaires, async (reportedCompany) => {
    const { itemId, type, _id } = reportedCompany

    const isSiret = validateSIRET(itemId)
    const finalType = isSiret ? LBA_ITEM_TYPE.RECRUTEURS_LBA : type
    const addedInfos = isSiret ? await getReportAdditionalInfos(itemId, LBA_ITEM_TYPE.RECRUTEURS_LBA) : await getAddedInfosForPartenaire(itemId)
    if (!addedInfos) {
      console.warn(`could not find additional infos for jobs partner with itemId=${itemId} and type=${type}`)
      return
    }
    console.info(`updating additional infos for jobs partner with itemId=${itemId} and type=${type}`)
    await getDbCollection("reported_companies").updateOne({ _id }, { $set: { ...addedInfos, type: finalType } })
  })
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false

const getAddedInfosForPartenaire = async (partnerJobId: string) => {
  const jobOpt = await getDbCollection("jobs_partners").findOne({ partner_job_id: partnerJobId })
  if (!jobOpt) return null
  const { offer_title, workplace_name, workplace_siret, partner_label } = jobOpt
  return {
    siret: workplace_siret,
    partnerLabel: partner_label,
    jobTitle: offer_title,
    companyName: workplace_name,
  }
}
