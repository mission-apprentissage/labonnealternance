import { Readable } from "stream"

import Boom from "boom"
import NodeClam from "clamscan"

import { sentryCaptureException, startSentryPerfRecording } from "@/common/utils/sentryUtils"

import { logger } from "../common/logger"
import { notifyToSlack } from "../common/utils/slackUtils"
import config from "../config"

let clamavCache: Promise<NodeClam> | null = null
let watcher: NodeJS.Timeout | null = null

async function createClamav() {
  return await new NodeClam().init({
    clamdscan: {
      host: config.env === "local" ? "localhost" : "clamav",
      port: 3310,
    },
  })
}

async function getClamav(): Promise<NodeClam> {
  if (clamavCache === null) {
    const retry = (error) => {
      const err = Boom.internal("Error initializing ClamAV")
      err.cause = error
      logger.error(err)
      sentryCaptureException(err)
      return createClamav()
    }

    const watch = (instance: NodeClam) => {
      watcher = setInterval(() => {
        instance.getVersion().catch((error) => {
          const err = Boom.internal("Error with ClamAV health check")
          err.cause = error
          logger.error(err)
          sentryCaptureException(err)
          handleClamavError()
        })
      }, 120_000)
      watcher.unref()

      return instance
    }

    clamavCache = createClamav().catch(retry).catch(retry).then(watch)
  }

  return clamavCache
}

function handleClamavError() {
  clamavCache = null
  if (watcher) clearInterval(watcher)
}

export async function getVersion(): Promise<string> {
  try {
    const clamav = await getClamav()
    const versions = await clamav.getVersion()
    return versions
  } catch (error) {
    handleClamavError()
    const err = Boom.internal("Error getting ClamAV versions")
    logger.error(err)
    err.cause = error
    throw err
  }
}

export async function isInfected(file: string): Promise<boolean> {
  const onFinish = startSentryPerfRecording("clamav", "scan")
  const clamav = await getClamav()
  const decodedAscii = Readable.from(Buffer.from(file.substring(file.indexOf(";base64,") + 8), "base64").toString("ascii"))
  const rs = Readable.from(decodedAscii)
  try {
    const { isInfected, viruses } = await clamav.scanStream(rs)
    if (isInfected === null) {
      throw Boom.internal("Unable to scan file for viruses", { viruses })
    }
    if (isInfected) {
      logger.error(`Virus detected ${viruses.toString()}`)
      await notifyToSlack({ subject: "CLAMAV", message: `Virus detected ${viruses.toString()}`, error: true })
    }
    return isInfected
  } catch (error) {
    handleClamavError()
    const err = Boom.internal("Error scanning file for viruses")
    err.cause = error
    throw err
  } finally {
    onFinish()
  }
}
