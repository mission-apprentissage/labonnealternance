import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"

const GRANTED_BY = "20261007120000-cancel-france-travail-directemploi-jobs-5656"

/**
 * Annule les offres France Travail et France Travail CEGID déjà publiées qui renvoient vers directemploi
 * (offres ISCOD). Les mappers les bloquent à l'import suivant (cf. `isDirectemploiApplyUrl`), mais les
 * offres actives restent visibles jusque-là.
 *
 * Motif figé ici (et non importé des mappers) : ce blocage est temporaire et sera retiré, la migration
 * doit rester compilable.
 */
export const up = async () => {
  const now = new Date()

  const { modifiedCount } = await getDbCollection("jobs_partners").updateMany(
    {
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      partner_label: { $in: [JOBPARTNERS_LABEL.FRANCE_TRAVAIL, JOBPARTNERS_LABEL.FRANCE_TRAVAIL_CEGID] },
      apply_url: { $regex: /directemploi/i },
    },
    {
      $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE, updated_at: now },
      $push: {
        offer_status_history: {
          date: now,
          status: JOB_STATUS_ENGLISH.ANNULEE,
          reason: "offre de CFA : candidature redirigée vers directemploi (ISCOD)",
          granted_by: GRANTED_BY,
        },
      },
    },
    { bypassDocumentValidation: true }
  )

  logger.info(`cancel france travail directemploi jobs 5656 : ${modifiedCount} offres annulées`)
}

export const requireShutdown: boolean = false
