import { Transform } from "stream"
import { pipeline } from "stream/promises"

import dayjs from "dayjs"
import { AccessEntityType, AccessStatus } from "shared/models"
import { UserEventType } from "shared/models/userWithAccount.model"
import SibApiV3Sdk from "sib-api-v3-sdk"

import { logger } from "@/common/logger"
import { ensureInitialization } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import config from "@/config"

type IBrevoContact = {
  user_origin: string
  user_first_name: string
  user_last_name: string
  user_email: string
  role_createdAt: Date
  role_authorized_type: AccessEntityType.CFA | AccessEntityType.ENTREPRISE
  entreprise_enseigne: string | null
  entreprise_raison_sociale: string | null
  cfa_enseigne: string | null
  cfa_raison_sociale: string | null
  job_count?: string | null
}

const CONTACT_LIST_RECETTE = 5
const CONTACT_LIST = 6

let contactCount = 0

const defaultClient = SibApiV3Sdk.ApiClient.instance
const apiKey = defaultClient.authentications["api-key"]
apiKey.apiKey = config.smtp.brevoApiKey
const apiInstance = new SibApiV3Sdk.ContactsApi()

const postToBrevo = async (contacts: IBrevoContact[]) => {
  contactCount += contacts.length

  const requestContactImport = new SibApiV3Sdk.RequestContactImport()

  requestContactImport.fileBody =
    "EMAIL;PRENOM;NOM;USER_ORIGIN;ROLE_AUTHORIZED_TYPE;ROLE_CREATEDAT;ENTREPRISE_ENSEIGNE;ENTREPRISE_RAISON_SOCIALE;CFA_ENSEIGNE;CFA_RAISON_SOCIALE;JOB_COUNT\n"
  contacts.forEach((contact) => {
    requestContactImport.fileBody += `${contact.user_email};${contact.user_first_name};${contact.user_last_name};${contact.user_origin ?? ""};${contact.role_authorized_type ?? ""};${dayjs(contact.role_createdAt).format("YYYY-MM-DD")};${contact.entreprise_enseigne ?? ""};${contact.entreprise_raison_sociale ?? ""};${contact.cfa_enseigne ?? ""};${contact.cfa_raison_sociale ?? ""};${contact.role_authorized_type === AccessEntityType.CFA ? 0 : contact.job_count}\n`
  })
  requestContactImport.listIds = [config.env === "production" ? CONTACT_LIST : CONTACT_LIST_RECETTE]
  requestContactImport.updateExistingContacts = true
  requestContactImport.emptyContactsAttributes = true

  await apiInstance.importContacts(requestContactImport)
}

const getRoleManagement360Stream = async (type: AccessEntityType) => {
  if (type === AccessEntityType.CFA) {
    return await ensureInitialization()
      .db()
      .collection("rolemanagement360")
      .find(
        { role_last_status: AccessStatus.GRANTED, user_last_status: UserEventType.ACTIF, role_authorized_type: AccessEntityType.CFA },
        {
          projection: {
            _id: 0,
            user_origin: 1,
            user_first_name: 1,
            user_last_name: 1,
            user_email: 1,
            role_createdAt: 1,
            role_authorized_type: 1,
            entreprise_enseigne: 1,
            entreprise_raison_sociale: 1,
            cfa_enseigne: 1,
            cfa_raison_sociale: 1,
          },
        }
      )
      .stream()
  } else {
    return await ensureInitialization()
      .db()
      .collection("rolemanagement360")
      .aggregate([
        {
          $match: {
            role_last_status: AccessStatus.GRANTED,
            user_last_status: UserEventType.ACTIF,
            role_authorized_type: AccessEntityType.ENTREPRISE,
          },
        },
        {
          $addFields: {
            role_authorized_object_id: { $convert: { input: "$role_authorized_id", to: "objectId" } },
          },
        },
        {
          $lookup: {
            from: "entreprises",
            localField: "role_authorized_object_id",
            foreignField: "_id",
            as: "entreprises",
          },
        },
        {
          $unwind: { path: "$entreprises" },
        },
        {
          $lookup: {
            from: "applications",
            let: { siret: "$entreprises.siret", email: "$user_email" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$company_siret", "$$siret"] }, { $eq: ["$company_email", "$$email"] }],
                  },
                },
              },
            ],
            as: "applications",
          },
        },
        {
          $group: {
            _id: {
              _id: "$_id",
              user_origin: "$user_origin",
              user_first_name: "$user_first_name",
              user_last_name: "$user_last_name",
              user_email: "$user_email",
              role_createdAt: "$role_createdAt",
              role_authorized_type: "$role_authorized_type",
              entreprise_enseigne: "$entreprise_enseigne",
              entreprise_raison_sociale: "$entreprise_raison_sociale",
              cfa_enseigne: "$cfa_enseigne",
              cfa_raison_sociale: "$cfa_raison_sociale",
            },
            application_count: { $sum: { $size: "$applications" } },
          },
        },
        {
          $project: {
            user_origin: "$_id.user_origin",
            user_first_name: "$_id.user_first_name",
            user_last_name: "$_id.user_last_name",
            user_email: "$_id.user_email",
            role_createdAt: "$_id.role_createdAt",
            role_authorized_type: "$_id.role_authorized_type",
            entreprise_enseigne: "$_id.entreprise_enseigne",
            entreprise_raison_sociale: "$_id.entreprise_raison_sociale",
            cfa_enseigne: "$_id.cfa_enseigne",
            cfa_raison_sociale: "$_id.cfa_raison_sociale",
            application_count: 1,
            _id: 0,
          },
        },
      ])
      .stream()
  }
}

const sendContacts = async (type: AccessEntityType) => {
  let batch: IBrevoContact[] = []

  const cursor = await getRoleManagement360Stream(type)

  const chunkTransform = new Transform({
    objectMode: true,
    transform(contact, _, callback) {
      batch.push(contact as IBrevoContact)

      if (batch.length === 1000) {
        postToBrevo(batch as IBrevoContact[])
        callback()
        batch = []
      } else {
        callback()
      }
    },
    flush(callback) {
      if (batch && batch.length > 0) {
        postToBrevo(batch as IBrevoContact[])
      }
      callback()
    },
  })

  await pipeline(cursor, chunkTransform)
}

export const sendContactsToBrevo = async () => {
  logger.info("Sending contacts to Brevo ...")

  try {
    await sendContacts(AccessEntityType.CFA)

    await sendContacts(AccessEntityType.ENTREPRISE)

    await notifyToSlack({
      subject: `Envoi des contacts vers Brevo`,
      message: `${contactCount} envoyés vers Brevo.`,
      error: contactCount === 0,
    })
  } catch (err) {
    sentryCaptureException(err)
    await notifyToSlack({ subject: "Envoi des contacts vers Brevo", message: `ECHEC envoi des contacts vers Brevo`, error: true })
    throw err
  }

  logger.info(`${contactCount} contacts sent to brevo`)
}
