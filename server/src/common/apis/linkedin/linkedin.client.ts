import type { Readable } from "node:stream"
import { logger } from "@/common/logger"
import { downloadFileFromSFTP } from "@/common/utils/ftp-utils"
import config from "@/config"

// Fichier unique, nom fixe, réécrit quotidiennement par LinkedIn (confirmé par le partenaire).
const LINKEDIN_REMOTE_FILE = "/upload/feed.xml"

export const getLinkedinJobs = async (): Promise<Readable> => {
  const { sftpHost, sftpUsername, sftpPrivateKey, sftpPassphrase } = config.linkedin

  if (!sftpPrivateKey) {
    throw new Error("LINKEDIN_SFTP_PRIVATE_KEY absent : le flux LinkedIn ne peut pas être récupéré")
  }

  logger.info("LinkedIn SFTP: connecting and starting file download")
  return downloadFileFromSFTP(LINKEDIN_REMOTE_FILE, {
    host: sftpHost,
    username: sftpUsername,
    privateKey: sftpPrivateKey,
    ...(sftpPassphrase ? { passphrase: sftpPassphrase } : {}),
  })
}
