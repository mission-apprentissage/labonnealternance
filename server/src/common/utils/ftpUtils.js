import Sentry from "@sentry/node"
import Ftp from "basic-ftp"
import { logger } from "../logger.js"

class FTPClient {
  constructor() {
    this.client = new Ftp.Client()
  }

  /**
   * @description Open an FTP connection
   * @param {object} options
   */
  async connect(options) {
    logger.info(`Connecting to FTP....`)

    try {
      await this.client.access(options)
    } catch (error) {
      Sentry.captureException(error)
      logger.error("FTP connection failed", error)
    }
  }

  async list() {
    console.log(await this.client.list())
  }

  /**
   * @description Disconnect an FTP connection
   */
  async disconnect() {
    logger.info(`Closing FTP....`)
    await this.client.close()
    logger.info(`Connection closed.`)
  }

  /**
   * @description Download a file from a remote FTP location
   * @param {string} remoteFile
   * @param {string} destinationPath
   */
  async downloadFile(remoteFile, destinationPath) {
    try {
      this.client.trackProgress((info) => logger.info(`${(info.bytes / 1000000).toFixed(2)} MB`))
      await this.client.downloadTo(destinationPath, remoteFile)
      this.client.trackProgress()
      logger.info(`File successfully downloaded.`)
    } catch (error) {
      Sentry.captureException(error)
      logger.error("Download failed:", error)
    }
  }
}

export { FTPClient }
