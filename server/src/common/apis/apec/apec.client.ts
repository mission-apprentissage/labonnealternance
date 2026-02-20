import { logger } from "@/common/logger"
import { downloadFileFromSFTP } from "@/common/utils/ftpUtils"
import config from "@/config"

const APEC_REMOTE_FILE = "/Export_offres_LA_BONNE_ALTERNANCE.xml"

export const getApecJobs = async (): Promise<NodeJS.ReadableStream> => {
  logger.info("APEC SFTP: connecting and starting file download")
  return downloadFileFromSFTP(APEC_REMOTE_FILE, {
    host: config.apec.url,
    username: config.apec.login,
    password: config.apec.password,
  })
}
