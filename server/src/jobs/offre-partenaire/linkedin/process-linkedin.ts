import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawLinkedinModel from "shared/models/raw-linkedin.model"
import { getLinkedinJobs, getLinkedinJobsStats } from "@/common/apis/linkedin/linkedin.client"
import { logger } from "@/common/logger"
import config from "@/config"
import { sftpFluxSource } from "@/jobs/offre-partenaire/flux-sources"
import { type FluxImportOptions, importFluxIfChanged } from "@/jobs/offre-partenaire/import-flux-if-changed"
import { importLinkedinRaw, importLinkedinToComputed } from "./import-linkedin"

export const processLinkedin = async ({ skipIfUnchanged = false }: FluxImportOptions = {}) => {
  // Pas de clé au vault (preview, local, recette non provisionnée) : on sort sans erreur plutôt que
  // de faire échouer le cron chaque nuit. Cohérent avec le caractère non `required()` de la config.
  if (!config.linkedin.sftpPrivateKey) {
    logger.warn("LinkedIn: LINKEDIN_SFTP_PRIVATE_KEY absent, import ignoré")
    return null
  }

  return importFluxIfChanged({
    fluxes: [
      {
        partnerLabel: JOBPARTNERS_LABEL.LINKEDIN,
        rawCollection: rawLinkedinModel.collectionName,
        source: sftpFluxSource({ stat: getLinkedinJobsStats, download: getLinkedinJobs }),
      },
    ],
    skipIfUnchanged,
    process: async ([stream]) => {
      const raw = await importLinkedinRaw(stream)
      const computed = await importLinkedinToComputed()
      return { raw, computed }
    },
  })
}
