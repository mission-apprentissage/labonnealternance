import { logger } from "../../common/logger"
import { getDbCollection } from "../../common/utils/mongodbUtils"

export const anonimizeAppointments = async () => {
  logger.info("job #anonimizeAppointments start")
  const archiveThreshold = new Date()
  archiveThreshold.setFullYear(archiveThreshold.getFullYear() - 1)

  const result = await getDbCollection("appointments").updateMany(
    { created_at: { $lte: archiveThreshold } },
    {
      $set: {
        etablissement_id: null,
        cle_ministere_educatif: undefined,
        formation_id: null,
        motivations: null,
        id_rco_formation: null,
        email_cfa: null,
        is_anonymized: true,
      },
    }
  )
  logger.info("job #anonimizeAppointments done")

  return result
}
