import { getLinkedinJobs } from "@/common/apis/linkedin/linkedin.client"
import { logger } from "@/common/logger"
import config from "@/config"
import { importLinkedinRaw, importLinkedinToComputed } from "./import-linkedin"

export const processLinkedin = async () => {
  // Pas de clé au vault (preview, local, recette non provisionnée) : on sort sans erreur plutôt que
  // de faire échouer le cron chaque nuit. Cohérent avec le caractère non `required()` de la config.
  if (!config.linkedin.sftpPrivateKey) {
    logger.warn("LinkedIn: LINKEDIN_SFTP_PRIVATE_KEY absent, import ignoré")
    return null
  }

  const sourceStream = await getLinkedinJobs()
  try {
    const raw = await importLinkedinRaw(sourceStream)
    const computed = await importLinkedinToComputed()
    return { raw, computed }
  } finally {
    // Libère le fichier temporaire même si l'import échoue avant d'avoir consommé le stream.
    sourceStream.destroy()
  }
}
