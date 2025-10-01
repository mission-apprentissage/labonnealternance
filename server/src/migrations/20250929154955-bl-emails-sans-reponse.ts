import { ObjectId } from "mongodb"

import { logger } from "@/common/logger"
import { s3ReadAsString } from "@/common/utils/awsUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  const listFileKey = "non_answering_cfa_emails_to_bl_lba-2966.json"

  const rawList = await s3ReadAsString("storage", listFileKey)

  if (!rawList) {
    logger.warn("No file found at the specified S3 location.")
    return
  }
  const notAnsweringEmails = JSON.parse(rawList)

  logger.info(`Found ${notAnsweringEmails.length} emails in the list.`)

  const now = new Date()
  const blackListAdditions = notAnsweringEmails.map((email) => ({
    _id: new ObjectId(),
    email,
    created_at: now,
    blacklisting_origin: "campagne 04/25 - RDVA sans réponse",
  }))

  await getDbCollection("emailblacklists").insertMany(blackListAdditions)
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
