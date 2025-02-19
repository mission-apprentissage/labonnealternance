import { Filter } from "mongodb"
import { ApplicationScanStatus, IApplication } from "shared/models"

import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import { deleteApplicationCvFile, processApplicationEmails, processApplicationScanForVirus } from "@/services/application.service"
import { isClamavAvailable } from "@/services/clamav.service"

import { getDbCollection } from "../../common/utils/mongodbUtils"
import { getApplicantFromDB } from "../../services/applicant.service"

const maxDuration = 1000 * 60 * 8 // 8 minutes

export async function processApplications() {
  logger.info("starting job processApplications")
  const timeoutTs = new Date().getTime() + maxDuration
  const scanResult: { success: number; error: number; total: number; virusDetected: number; ids_in_error: string[] } = {
    success: 0,
    error: 0,
    total: 0,
    virusDetected: 0,
    ids_in_error: [],
  }
  if (await isClamavAvailable()) {
    const normalScanResult = await processApplicationGroup({ scan_status: ApplicationScanStatus.WAITING_FOR_SCAN }, timeoutTs)
    const errorScanResult = await processApplicationGroup({ scan_status: ApplicationScanStatus.ERROR_CLAMAV }, timeoutTs)
    const emailResult = await processApplicationGroup({ to_applicant_message_id: null, scan_status: ApplicationScanStatus.NO_VIRUS_DETECTED }, timeoutTs)

    const results = [normalScanResult, errorScanResult, emailResult]
    const add = (a: number, b: number) => a + b
    scanResult.success += results.map((result) => result.success).reduce(add, 0)
    scanResult.error += results.map((result) => result.error).reduce(add, 0)
    scanResult.virusDetected += results.map((result) => result.virusDetected).reduce(add, 0)
    scanResult.total += results.map((result) => result.total).reduce(add, 0)
    scanResult.ids_in_error.push(...results.map((result) => result.ids_in_error).flat())

    if (scanResult.error > 0 || scanResult.virusDetected > 0) {
      await notifyToSlack({
        subject: "Envoi des candidatures",
        message: `${scanResult.total} candidatures. ${scanResult.success} candidatures envoyées. ${scanResult.error} erreurs. ${scanResult.virusDetected} virus détecté.\r\n\r\nIDs candidatures en erreur :\r\n - ${scanResult.ids_in_error.join("\r\n - ")}`,
        error: true,
      })
    }
  } else {
    await notifyToSlack({
      subject: "Envoi des candidatures",
      message: `Clamav indisponible`,
      error: true,
    })
  }
  logger.info("ended job processApplications")
}

const processApplicationGroup = async (applicationFilter: Filter<IApplication>, timeoutTs: number) => {
  logger.info("start processing applications for filter", applicationFilter)
  const applicationCount = await getDbCollection("applications").countDocuments(applicationFilter)
  const results: { success: number; error: number; total: number; virusDetected: number; ids_in_error: string[] } = {
    success: 0,
    error: 0,
    total: applicationCount,
    virusDetected: 0,
    ids_in_error: [],
  }
  logger.info(`${applicationCount} applications to scan.`)
  if (new Date().getTime() >= timeoutTs) {
    return results
  }
  const applicationsToProcess = await getDbCollection("applications").find(applicationFilter).toArray()
  await asyncForEach(applicationsToProcess, async (application) => {
    if (new Date().getTime() >= timeoutTs) {
      return
    }
    const applicant = await getApplicantFromDB({ _id: application.applicant_id })
    if (!applicant) {
      await getDbCollection("applications").findOneAndUpdate({ _id: application._id }, { $set: { scan_status: ApplicationScanStatus.ERROR_APPLICANT_NOT_FOUND } })
      return
    }
    try {
      let hasVirus: boolean = false
      if (application.scan_status !== ApplicationScanStatus.NO_VIRUS_DETECTED) {
        try {
          hasVirus = await processApplicationScanForVirus(application, applicant)
          if (hasVirus) {
            results.virusDetected++
            results.ids_in_error.push(application._id.toString())
          }
        } catch (err2) {
          await getDbCollection("applications").findOneAndUpdate({ _id: application._id }, { $set: { scan_status: ApplicationScanStatus.ERROR_CLAMAV } })
          throw err2
        }
      }
      if (!hasVirus) {
        try {
          await processApplicationEmails.sendEmailsIfNeeded(application, applicant)
          results.success++
        } catch (err3) {
          await getDbCollection("applications").findOneAndUpdate({ _id: application._id }, { $set: { scan_status: ApplicationScanStatus.DO_NOT_SEND } })
          throw err3
        }
      }
      await deleteApplicationCvFile(application)
    } catch (err) {
      results.error++
      results.ids_in_error.push(application._id.toString())
      logger.error(`error while processing application with id=${application._id}`, err)
      sentryCaptureException(err, { data: { applicationId: application._id } })
    }
  })
  logger.info(
    "done scanning applications for virus with filter",
    applicationFilter,
    `total=${applicationCount}, success=${results.success}, errors=${results.error}. virus detected=${results.virusDetected}`
  )
  return results
}
