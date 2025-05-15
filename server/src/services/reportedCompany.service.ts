import { ObjectId } from "mongodb"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { getSiretInfos } from "@/services/cacheInfosSiret.service"
import { formatEntrepriseData } from "@/services/etablissement.service"
import { getOffre } from "@/services/formulaire.service"

export const reportCompany = async ({ reason, reasonDetails, itemId, type }: { reason: string; reasonDetails?: string; itemId: string; type: LBA_ITEM_TYPE }) => {
  const additionalInfos = await getReportAdditionalInfos(itemId, type)
  await getDbCollection("reported_companies").insertOne({
    ...additionalInfos,
    _id: new ObjectId(),
    createdAt: new Date(),
    type,
    itemId,
    reason,
    reasonDetails,
  })
}

export const getReportAdditionalInfos = async (itemId: string, type: LBA_ITEM_TYPE) => {
  switch (type) {
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA: {
      const recruiterOpt = await getOffre(itemId)
      const jobOpt = recruiterOpt?.jobs.find((job) => job._id.toString() === itemId)
      if (!jobOpt || !recruiterOpt) {
        return null
      }
      const { establishment_siret, establishment_raison_sociale, establishment_enseigne } = recruiterOpt
      const { rome_appellation_label, offer_title_custom } = jobOpt
      return {
        siret: establishment_siret,
        companyName: establishment_raison_sociale || establishment_enseigne,
        jobTitle: offer_title_custom ?? rome_appellation_label,
        partnerLabel: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      }
    }
    case LBA_ITEM_TYPE.RECRUTEURS_LBA: {
      const recruteur = await getDbCollection("jobs_partners").findOne({ workplace_siret: itemId, partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA })
      if (recruteur) {
        const { workplace_siret, workplace_legal_name, workplace_name } = recruteur
        return {
          siret: workplace_siret,
          companyName: workplace_legal_name || workplace_name,
          partnerLabel: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
        }
      }
      const siretInfos = await getSiretInfos(itemId)
      if (siretInfos && siretInfos !== BusinessErrorCodes.NON_DIFFUSIBLE) {
        const { establishment_siret, establishment_raison_sociale, establishment_enseigne } = formatEntrepriseData(siretInfos.data)
        return {
          siret: establishment_siret,
          partnerLabel: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
          companyName: establishment_enseigne ?? establishment_raison_sociale,
        }
      }
      return null
    }
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES: {
      const jobOpt = await getDbCollection("jobs_partners").findOne({ _id: new ObjectId(itemId) })
      if (!jobOpt) return null
      const { offer_title, workplace_name, workplace_siret, partner_label } = jobOpt
      return {
        siret: workplace_siret,
        partnerLabel: partner_label,
        jobTitle: offer_title,
        companyName: workplace_name,
      }
    }
    default: {
      return null
    }
  }
}
