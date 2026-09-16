import Ftp from "basic-ftp"
import { Client as SFTPClient } from "ssh2"
import { logger } from "@/common/logger"
import { sentryCaptureException } from "./sentry-utils"

class FTPClient {
  client = new Ftp.Client()

  /**
   * @description Open an FTP connection
   * @param {object} options
   */
  async connect(options) {
    logger.info(`Connecting to FTP....`)

    try {
      await this.client.access(options)
    } catch (error) {
      sentryCaptureException(error)
      logger.error(error, "FTP connection failed")
    }
  }

  async list() {
    console.info(await this.client.list())
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
      sentryCaptureException(error)
      logger.error(error, "Download failed:")
    }
  }
}

export { FTPClient }

type SFTPConnectOptions = {
  host: string
  port?: number
  username: string
  // Authentification par mot de passe (APEC) ou par clé privée (LinkedIn) : au moins l'une des deux.
  password?: string
  privateKey?: string
}

// Les clés privées stockées au vault sont sur une seule ligne (le template .env ne supporte pas
// le multi-ligne) : on restaure les retours à la ligne avant de les passer à ssh2.
export const normalizeSshPrivateKey = (privateKey: string): string => {
  const normalized = privateKey.replace(/\\n/g, "\n")
  return normalized.endsWith("\n") ? normalized : `${normalized}\n`
}

export const downloadFileFromSFTP = async (remotePath: string, options: SFTPConnectOptions): Promise<NodeJS.ReadableStream> => {
  return new Promise((resolve, reject) => {
    const conn = new SFTPClient()

    conn.on("ready", () => {
      conn.sftp((err, sftp) => {
        if (err) {
          conn.end()
          return reject(err)
        }

        const stream = sftp.createReadStream(remotePath)

        stream.on("error", (err: Error) => {
          conn.end()
          reject(err)
        })

        stream.on("close", () => conn.end())

        resolve(stream)
      })
    })

    conn.on("error", reject)

    const { privateKey, ...rest } = options
    conn.connect({ port: 22, ...rest, ...(privateKey ? { privateKey: normalizeSshPrivateKey(privateKey) } : {}) })
  })
}
