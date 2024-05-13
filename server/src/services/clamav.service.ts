import { Readable } from "stream"

import NodeClam from "clamscan"

import { startSentryPerfRecording } from "@/common/utils/sentryUtils"

import { logger } from "../common/logger"
import { notifyToSlack } from "../common/utils/slackUtils"
import config from "../config"

class ClamAVService {
  private static instance: ClamAVService | null = null
  private clamav: Promise<NodeClam> | null = null

  private constructor() {
    this.clamav = this.initClamAV()
  }

  public static getInstance(): ClamAVService {
    if (!ClamAVService.instance) {
      ClamAVService.instance = new ClamAVService()
    }
    return ClamAVService.instance
  }

  private async initClamAV(): Promise<NodeClam> {
    return new Promise((resolve, reject) => {
      const clamav = new NodeClam()
      clamav
        .init({
          clamdscan: {
            host: config.env === "local" ? "localhost" : "clamav",
            port: 3310,
          },
        })
        .then(() => resolve(clamav))
        .catch(reject)
    })
  }

  private async getClamAV(): Promise<NodeClam> {
    if (!this.clamav) {
      throw new Error("ClamAV is not initialized")
    }
    return this.clamav
  }

  public async getVersions(): Promise<string[] | null> {
    try {
      const clamav = await this.getClamAV()
      const versions = await clamav.getVersion()
      return versions
    } catch (error) {
      console.error("Error getting ClamAV versions:", error)
      return null
    }
  }

  public async isInfected(file: string): Promise<boolean | null> {
    const onFinish = startSentryPerfRecording("clamav", "scan")
    const clamav = await this.getClamAV()
    const decodedAscii = Readable.from(Buffer.from(file.substring(file.indexOf(";base64,") + 8), "base64").toString("ascii"))
    const rs = Readable.from(decodedAscii)
    try {
      const { isInfected, viruses } = await clamav.scanStream<{ isInfected: boolean; file: string; viruses: string[] }>(rs)
      if (isInfected) {
        logger.error(`Virus detected ${viruses.toString()}`)
        await notifyToSlack({ subject: "CLAMAV", message: `Virus detected ${viruses.toString()}`, error: true })
      }
      return isInfected
    } catch (error) {
      console.error("Error scanning file for viruses:", error)
      return null
    } finally {
      onFinish()
    }
  }
}

// Factory function to get the singleton instance
export function getClamAVServiceInstance(): ClamAVService {
  return ClamAVService.getInstance()
}
