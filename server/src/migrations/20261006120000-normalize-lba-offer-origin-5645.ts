import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { JOBS_PARTNERS_OFFER_ORIGIN } from "shared/models/jobs-partners-computed.model"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"

/**
 * Ramène à "La bonne alternance" les offres LBA dont offer_origin vaut "labonnealternance", "lba" ou ""
 * (casse et espaces indifférents), recopiés depuis l'origine du compte en dépôt simplifié (cf. normalizeOfferOrigin).
 *
 * `bypassDocumentValidation` : des offres anciennes ne respectent pas le schéma actuel.
 */
export const up = async () => {
  const { modifiedCount } = await getDbCollection("jobs_partners").updateMany(
    { partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, offer_origin: { $regex: /^\s*(labonnealternance|lba)?\s*$/i } },
    { $set: { offer_origin: JOBS_PARTNERS_OFFER_ORIGIN.LBA } },
    { bypassDocumentValidation: true }
  )
  logger.info(`normalisation offer_origin : ${modifiedCount} offres mises à jour`)
}

export const requireShutdown: boolean = false
