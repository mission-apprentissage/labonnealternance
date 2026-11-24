import { logger } from "@/common/logger"
import { downloadFileFromSFTP, statFileOnSFTP } from "@/common/utils/ftp-utils"
import config from "@/config"

// Fichier unique, nom fixe, réécrit quotidiennement par LinkedIn (confirmé par le partenaire).
const LINKEDIN_REMOTE_FILE = "/upload/feed.xml"

const getLinkedinSftpOptions = () => {
  const { sftpHost, sftpUsername, sftpPrivateKey, sftpPassphrase } = config.linkedin

  if (!sftpPrivateKey) {
    throw new Error("LINKEDIN_SFTP_PRIVATE_KEY absent : le flux LinkedIn ne peut pas être récupéré")
  }

  return {
    host: sftpHost,
    username: sftpUsername,
    privateKey: sftpPrivateKey,
    ...(sftpPassphrase ? { passphrase: sftpPassphrase } : {}),
  }
}

export const getLinkedinJobs = async () => {
  const options = getLinkedinSftpOptions()
  logger.info("LinkedIn SFTP: connecting and starting file download")
  return downloadFileFromSFTP(LINKEDIN_REMOTE_FILE, options)
}

export const getLinkedinJobsStats = async () => statFileOnSFTP(LINKEDIN_REMOTE_FILE, getLinkedinSftpOptions())
