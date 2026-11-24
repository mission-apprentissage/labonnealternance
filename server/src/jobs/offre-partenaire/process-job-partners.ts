import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL, jobPartnersExcludedFromFlux } from "shared/models/jobs-partners.model"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import type { RemovalGuardBlock } from "./cancel-removed-jobs-partners"
import { cancelRemovedJobsPartners, formatRemovalGuardBlock } from "./cancel-removed-jobs-partners"
import { detectDuplicateJobPartners } from "./detect-duplicate-job-partners"
import { fillComputedJobsPartners } from "./fill-computed-jobs-partners"
import { fillLbaUrl } from "./fill-lba-url"
import { importFromComputedToJobsPartners } from "./import-from-computed-to-jobs-partners"
import { JobPartnersGuardrailError } from "./jobs-partners-guardrails"
import { PartnerLockUnavailableError, withPartnerLocks } from "./partner-processing-lock"
import { validateComputedJobPartners } from "./validate-computed-job-partners"

export const jobPartnersByFlux = Object.values(JOBPARTNERS_LABEL).filter((jobPartner) => !jobPartnersExcludedFromFlux.includes(jobPartner))

// Au démarrage du job, un import non tagué peut encore tourner sur l'autre runner (cf. timings dans jobs-partners.importer.ts).
export const PROCESS_COMPUTED_LOCK_WAIT_MS = 60 * 60 * 1000

/**
 * Fait échouer le job une fois le traitement des autres partenaires terminé : un blocage ne doit pas sortir en succès.
 * Message sur une ligne : job-processor ne conserve que les 3 premières lignes de la stack dans output.error.
 */
const failOnIncompleteRun = ({ blocked, skipped }: { blocked: RemovalGuardBlock[]; skipped: string[] }) => {
  if (blocked.length) {
    const skippedLine = skipped.length ? [`partenaires non traités, verrou détenu par un autre traitement : ${skipped.join(", ")}`] : []
    throw new JobPartnersGuardrailError([...blocked.map(formatRemovalGuardBlock), ...skippedLine].join(" ; "))
  }
  if (skipped.length) {
    throw new PartnerLockUnavailableError(skipped)
  }
}

const skippedPartners = (lockedPartnerLabels: string[]) => jobPartnersByFlux.filter((partnerLabel) => !lockedPartnerLabels.includes(partnerLabel))

/**
 * Annule les offres des partenaires traités par flux qui ne sont plus présentes dans le flux source.
 * Sous-job CLI-safe : le filtre est encapsulé ici, jamais vide.
 */
export const cancelRemovedJobsPartnersFlux = async () =>
  withPartnerLocks(
    jobPartnersByFlux,
    async (lockedPartnerLabels) => {
      const { blocked } = await cancelRemovedJobsPartners({ partner_label: { $in: lockedPartnerLabels } }, { removalGuard: true })
      failOnIncompleteRun({ blocked, skipped: skippedPartners(lockedPartnerLabels) })
    },
    { requireAll: false }
  )

/**
 * Point d'entrée CLI (`yarn cli forceCancelRemovedJobsPartners --partnerLabel Hellowork`) : annule sans garde-fou les
 * offres d'un partenaire absentes de son flux, une fois vérifié que la baisse de volume signalée est légitime.
 */
export const forceCancelRemovedJobsPartners = async (payload?: { partnerLabel?: string }) => {
  const partnerLabel = jobPartnersByFlux.find((label) => label === payload?.partnerLabel)
  if (!partnerLabel) {
    throw new Error(`forceCancelRemovedJobsPartners: --partnerLabel requis, parmi : ${jobPartnersByFlux.join(", ")}`)
  }
  return withPartnerLocks([partnerLabel], async () => {
    const countActive = () => getDbCollection("jobs_partners").countDocuments({ partner_label: partnerLabel, offer_status: JOB_STATUS_ENGLISH.ACTIVE })
    const activeBefore = await countActive()
    await cancelRemovedJobsPartners({ partner_label: partnerLabel }, { removalGuard: false })
    const activeAfter = await countActive()
    logger.info({ partnerLabel, activeBefore, activeAfter }, "forceCancelRemovedJobsPartners: annulation forcée terminée")
    return { partnerLabel, activeBefore, cancelled: activeBefore - activeAfter }
  })
}

export const fillComputedJobsPartnersFlux = async () => {
  return fillComputedJobsPartners({ addedMatchFilter: { partner_label: { $in: jobPartnersByFlux } } })
}

export const detectDuplicateJobPartnersFlux = async () => {
  return detectDuplicateJobPartners({ addedMatchFilter: { partner_label: { $in: jobPartnersByFlux } } })
}

export const validateComputedJobPartnersFlux = async () => {
  return validateComputedJobPartners({ addedMatchFilter: { partner_label: { $in: jobPartnersByFlux } } })
}

export const processComputedAndImportToJobPartners = async () =>
  withPartnerLocks(
    jobPartnersByFlux,
    async (lockedPartnerLabels) => {
      logger.info("début de processComputedAndImportToJobPartners")
      const filter = { partner_label: { $in: lockedPartnerLabels } }
      const filled = await fillComputedJobsPartners({ addedMatchFilter: filter })
      const imported = await importFromComputedToJobsPartners(filter)
      const { blocked } = await cancelRemovedJobsPartners(filter, { removalGuard: true })
      await fillLbaUrl()
      logger.info("fin de processComputedAndImportToJobPartners")
      failOnIncompleteRun({ blocked, skipped: skippedPartners(lockedPartnerLabels) })
      return { filled, imported }
    },
    { requireAll: false, waitMs: PROCESS_COMPUTED_LOCK_WAIT_MS }
  )
