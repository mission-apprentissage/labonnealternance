import type { ObjectId } from "mongodb"
import { BusinessErrorCodes } from "shared/constants/error-codes"
import GEIQ_WHITELIST from "shared/constants/geiq"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { jobPartnersExcludedFromFlux } from "shared/models/jobs-partners.model"
import { PARTNER_WHITELIST } from "shared/models/jobs-partners-computed.model"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { getNormalizedStringInSetOrArray } from "@/common/utils/string-utils"

const GRANTED_BY = "20260915103000-cancel-cfa-jobs-5447"

/**
 * Annule les offres déjà publiées des CFA ajoutés à la blacklist par le ticket 5447.
 *
 * `blockJobsPartnersFromCfaList` marque bien ces offres en `business_error` au prochain import,
 * ce qui les empêche d'être réimportées, mais rien n'annule les documents `jobs_partners`
 * déjà actifs : `cancelRemovedJobsPartners` ne cible que les offres sans computed correspondant.
 * Sans cette migration, les offres restent visibles jusqu'à leur expiration.
 *
 * La liste est volontairement figée ici (et non importée de `is-company-in-blocked-cfa-list.ts`)
 * pour que la migration reste reproductible quand la blacklist évoluera.
 */
const NEW_BLOCKED_CFA = ["CAMPUS FORMATION ET METIERS", "ESUP LYON", "GROUPE LIP", "IFRIA OCCITANIE"]

// même détection que le pipeline de blocage : normalisation casse/accents et correspondance sur mots entiers
const getNewBlockedCfaMention = getNormalizedStringInSetOrArray(NEW_BLOCKED_CFA)

export const up = async () => {
  const now = new Date()
  const BATCH_SIZE = 500

  // Mêmes exclusions que blockJobsPartnersFromCfaList, pour ne pas annuler ce que le pipeline n'aurait jamais bloqué.
  // jobPartnersExcludedFromFlux en plus : OFFRES_EMPLOI_LBA et RECRUTEURS_LBA ne passent ni par le pipeline flux
  // (process-job-partners) ni par le pipeline API (process-job-partners-for-api, qui exclut tout JOBPARTNERS_LABEL),
  // donc leurs offres ne sont jamais soumises à la liste de blocage CFA. Les partenaires API, eux, restent inclus.
  const cursor = getDbCollection("jobs_partners").find(
    {
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      partner_label: { $nin: [...PARTNER_WHITELIST, ...jobPartnersExcludedFromFlux] },
      workplace_siret: { $nin: GEIQ_WHITELIST },
    },
    { projection: { _id: 1, workplace_name: 1, offer_description: 1, workplace_description: 1 } }
  )

  let batch: ObjectId[] = []
  let totalModified = 0

  const flush = async () => {
    if (batch.length === 0) return
    // Garde sur offer_status : "Active" < "Cancelled", donc un document mis à jour avance dans l'index
    // {offer_status: 1, ...} scanné par le curseur et peut être renvoyé une seconde fois. Sans cette garde,
    // la seconde passe ajouterait une entrée offer_status_history en double.
    const { modifiedCount } = await getDbCollection("jobs_partners").updateMany(
      { _id: { $in: batch }, offer_status: JOB_STATUS_ENGLISH.ACTIVE },
      {
        $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE, updated_at: now },
        $push: {
          offer_status_history: {
            date: now,
            status: JOB_STATUS_ENGLISH.ANNULEE,
            reason: BusinessErrorCodes.IS_CFA,
            granted_by: GRANTED_BY,
          },
        },
      }
    )
    totalModified += modifiedCount
    batch = []
  }

  for await (const { _id, workplace_name, offer_description, workplace_description } of cursor) {
    const isBlocked = [workplace_name, offer_description, workplace_description].some((value) => Boolean(getNewBlockedCfaMention(value)))
    if (!isBlocked) continue

    batch.push(_id)
    if (batch.length >= BATCH_SIZE) {
      await flush()
    }
  }
  await flush()

  logger.info(`cancel cfa jobs 5447 : ${totalModified} offres annulées`)
}

export const requireShutdown: boolean = false
