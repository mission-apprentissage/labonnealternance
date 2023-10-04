import { Readable } from "stream"

import NodeClam from "clamscan"
import tcpPortUsed from "tcp-port-used"

import { logger } from "../common/logger"
import { notifyToSlack } from "../common/utils/slackUtils"
import config from "../config"

let scanner

const setScanner = async () => {
  scanner = await initScanner()
  logger.info("Clamav scanner initialized")
}

/**
 * @description Initialize clamav scanner.
 * @returns {Promise<unknown>}
 */
const initScanner = (): Promise<unknown> => {
  const port = 3310
  const host = config.env === "local" ? "localhost" : "clamav"

  return new Promise((resolve, reject) => {
    tcpPortUsed
      .waitUntilUsedOnHost(port, host, 500, 30000)
      .then(() => {
        const params = {
          //debugMode: config.env === "local" ? true : false, // This will put some debug info in your js console
          clamdscan: {
            host,
            port,
            bypassTest: false,
          },
        }

        const clamscan = new NodeClam().init(params)
        resolve(clamscan)
      })
      .catch(reject)
  })
}

/**
 * @description Scan a "string".
 * @param {string} fileContent
 * @returns {Promise<boolean>}
 */
const scanString = async (fileContent: string): Promise<boolean> => {
  // le fichier est encodé en base 64 à la suite d'un en-tête.
  const decodedAscii = Readable.from(Buffer.from(fileContent.substring(fileContent.indexOf(";base64,") + 8), "base64").toString("ascii"))
  const rs = Readable.from(decodedAscii)

  const { isInfected, viruses } = await scanner.scanStream(rs)

  if (isInfected) {
    logger.error(`Virus detected ${viruses.toString()}`)
    await notifyToSlack({ subject: "CLAMAV", message: `Virus detected ${viruses.toString()}`, error: true })
  }

  return isInfected
}

/**
 * @description Scan a file.
 * @param {string} fileContent
 * @returns {Promise<boolean>}
 */
const scan = async (fileContent: string): Promise<boolean> => {
  if (scanner) {
    return scanString(fileContent)
  }

  try {
    logger.info("Initalizing Clamav")
    await setScanner()

    return scanString(fileContent)
  } catch (err) {
    logger.error("Error initializing Clamav " + err)

    return false
  }
}

export { scan }
