import { logger } from "@/common/logger"
import { downloadFileFromSFTP, statFileOnSFTP } from "@/common/utils/ftp-utils"
import config from "@/config"

const APEC_REMOTE_FILE = "/Export_offres_LA_BONNE_ALTERNANCE.xml"

const getApecSftpOptions = () => ({
  host: config.apec.url,
  username: config.apec.login,
  password: config.apec.password,
})

export const getApecJobs = async () => {
  logger.info("APEC SFTP: connecting and starting file download")
  return downloadFileFromSFTP(APEC_REMOTE_FILE, getApecSftpOptions())
}

export const getApecJobsStats = async () => statFileOnSFTP(APEC_REMOTE_FILE, getApecSftpOptions())
