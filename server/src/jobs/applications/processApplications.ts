import { Filter } from "mongodb"
import { ApplicationScanStatus, IApplication } from "shared/models"

import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import { deleteApplicationCvFile, processApplicationEmails, processApplicationScanForVirus } from "@/services/application.service"
import { isClamavAvailable } from "@/services/clamav.service"

import { getDbCollection } from "../../common/utils/mongodbUtils"

export async function processApplications(batchSize: number) {
  logger.info("starting job processApplications")
  const scanResult = { success: 0, error: 0, total: 0 }
  if (await isClamavAvailable()) {
    const normalScanResult = await scanApplications({ scan_status: ApplicationScanStatus.WAITING_FOR_SCAN }, batchSize)
    const errorScanResult = await scanApplications({ scan_status: ApplicationScanStatus.ERROR_CLAMAV }, batchSize)
    scanResult.success += normalScanResult.success + errorScanResult.success
    scanResult.error += normalScanResult.error + errorScanResult.error
    scanResult.total += normalScanResult.total + errorScanResult.total
    await notifyToSlack({
      subject: "Scan des candidatures",
      message: `${scanResult.total} candidatures à scanner. ${scanResult.success} candidatures scannées. ${scanResult.error} erreurs.`,
      error: scanResult.error > 0,
    })
  } else {
    await notifyToSlack({
      subject: "Scan des candidatures",
      message: `Clamav indisponible`,
      error: true,
    })
  }
  const emailResult = await sendApplicationsEmails({ to_applicant_message_id: null, scan_status: ApplicationScanStatus.NO_VIRUS_DETECTED }, batchSize)
  await notifyToSlack({
    subject: "Envoi des candidatures",
    message: `${emailResult.total} candidatures à envoyer. ${emailResult.success} candidatures envoyées. ${emailResult.error} erreurs.`,
    error: emailResult.error > 0,
  })
  await deleteApplicationFiles({ to_applicant_message_id: { $ne: null }, to_company_message_id: { $ne: null }, scan_status: ApplicationScanStatus.NO_VIRUS_DETECTED }, batchSize)
  logger.info("ended job processApplications")
}

const scanApplications = async (applicationFilter: Filter<IApplication>, batchSize: number) => {
  logger.info("start scanning applications for virus with filter", applicationFilter)
  const applicationCount = await getDbCollection("applications").countDocuments(applicationFilter)
  logger.info(`${applicationCount} applications to scan. Taking the first ${batchSize}`)
  const applicationsToScan = await getDbCollection("applications").find(applicationFilter).limit(batchSize).toArray()
  const results = { success: 0, error: 0, total: applicationCount, virusDetected: 0 }
  await asyncForEach(applicationsToScan, async (application) => {
    try {
      const hasVirus = await processApplicationScanForVirus(application)
      results.success++
      if (hasVirus) {
        results.virusDetected++
      }
    } catch (err) {
      results.error++
      logger.error(`error while scanning application with id=${application._id}`, err)
      sentryCaptureException(err, { data: { applicationId: application._id } })
      await getDbCollection("applications").findOneAndUpdate({ _id: application._id }, { $set: { scan_status: ApplicationScanStatus.ERROR_CLAMAV } })
    }
  })
  logger.info(
    "done scanning applications for virus with filter",
    applicationFilter,
    `total=${applicationCount}, success=${results.success}, errors=${results.error}. virus detected=${results.virusDetected}`
  )
  return results
}

const sendApplicationsEmails = async (applicationFilter: Filter<IApplication>, batchSize: number) => {
  logger.info("start sending emails for applications with filter", applicationFilter)
  const applicationCount = await getDbCollection("applications").countDocuments(applicationFilter)
  logger.info(`${applicationCount} applications to send emails. Taking the first ${batchSize}`)
  const applications = await getDbCollection("applications").find(applicationFilter).limit(batchSize).toArray()
  const results = { success: 0, error: 0, total: applicationCount }
  await asyncForEach(applications, async (application) => {
    try {
      await processApplicationEmails.sendEmailsIfNeeded(application)
      results.success++
    } catch (err) {
      results.error++
      logger.error(`error while sending application emails with id=${application._id}`, err)
      sentryCaptureException(err, { data: { applicationId: application._id } })
    }
  })
  logger.info("done sending applications emails with filter", applicationFilter, `total=${applicationCount}, success=${results.success}, errors=${results.error}`)
  return results
}

const deleteApplicationFiles = async (applicationFilter: Filter<IApplication>, batchSize: number) => {
  logger.info("start removing attachments from s3")
  const applicationCount = await getDbCollection("applications").countDocuments(applicationFilter)
  logger.info(`${applicationCount} attachment to remove. Taking the first ${batchSize}`)
  const applications = await getDbCollection("applications").find(applicationFilter).limit(batchSize).toArray()
  const results = { success: 0, error: 0, total: applicationCount }
  await asyncForEach(applications, async (application) => {
    try {
      await deleteApplicationCvFile(application)
      results.success++
    } catch (err) {
      results.error++
      logger.error(`error while removing attachment with id=${application._id}`, err)
      sentryCaptureException(err, { data: { applicationId: application._id } })
    }
  })
  logger.info("done removing attachement with filter", applicationFilter, `total=${applicationCount}, success=${results.success}, errors=${results.error}`)
}
