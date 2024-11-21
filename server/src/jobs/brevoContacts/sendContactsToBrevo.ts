import { Transform } from "stream"
import { pipeline } from "stream/promises"

import { ColumnOption, stringify } from "csv-stringify/sync"
import dayjs from "dayjs"
import { AccessEntityType, AccessStatus } from "shared/models"
import { UserEventType } from "shared/models/userWithAccount.model"
import SibApiV3Sdk from "sib-api-v3-sdk"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import { streamGroupByCount } from "@/common/utils/streamUtils"
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
  entreprise_siret: string | null
  cfa_enseigne: string | null
  cfa_raison_sociale: string | null
  cfa_siret: string | null
  job_count?: string | null
}

const CONTACT_LIST_RECETTE = 11
const CONTACT_LIST = 6

let contactCount = 0

const defaultClient = SibApiV3Sdk.ApiClient.instance
const apiKey = defaultClient.authentications["api-key"]
apiKey.apiKey = config.smtp.brevoApiKey
const apiInstance = new SibApiV3Sdk.ContactsApi()

const formatter = (value) => value ?? ""

const postToBrevo = async (contacts: IBrevoContact[]) => {
  contactCount += contacts.length

  const requestContactImport = new SibApiV3Sdk.RequestContactImport()

  const fileBody = stringify(contacts, {
    delimiter: ";",
    header: true,
    columns: [
      {
        key: "user_email",
        header: "EMAIL",
      },
      { key: "user_first_name", header: "PRENOM" },
      { key: "user_last_name", header: "NOM" },
      {
        key: "user_origin",
        header: "USER_ORIGIN",
        formatter,
      },
      {
        key: "role_authorized_type",
        header: "ROLE_AUTHORIZED_TYPE",
        formatter,
      },
      {
        key: "role_createdAt",
        header: "ROLE_CREATEDAT",
        formatter: (value) => dayjs(value).format("YYYY-MM-DD"),
      },
      {
        key: "entreprise_enseigne",
        header: "ENTREPRISE_ENSEIGNE",
        formatter,
      },
      {
        key: "entreprise_raison_sociale",
        header: "ENTREPRISE_RAISON_SOCIALE",
        formatter,
      },
      {
        key: "entreprise_siret",
        header: "ENTREPRISE_SIRET",
        formatter,
      },
      {
        key: "cfa_enseigne",
        header: "CFA_ENSEIGNE",
        formatter,
      },
      {
        key: "cfa_raison_sociale",
        header: "CFA_RAISON_SOCIALE",
        formatter,
      },
      {
        key: "cfa_siret",
        header: "CFA_SIRET",
        formatter,
      },
      {
        key: "job_count",
        header: "JOB_COUNT",
        formatter: (value) => value || "0",
      },
    ] as ColumnOption[],
  })

  requestContactImport.fileBody = fileBody
  requestContactImport.listIds = [config.env === "production" ? CONTACT_LIST : CONTACT_LIST_RECETTE]
  requestContactImport.updateExistingContacts = true
  requestContactImport.emptyContactsAttributes = true

  await apiInstance.importContacts(requestContactImport)
}

const getRoleManagement360Stream = async (type: AccessEntityType) => {
  if (type === AccessEntityType.CFA) {
    return await getDbCollection("rolemanagement360")
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
            entreprise_siret: 1,
            cfa_enseigne: 1,
            cfa_raison_sociale: 1,
            cfa_siret: 1,
          },
        }
      )
      .stream()
  } else {
    return await getDbCollection("rolemanagement360")
      .aggregate([
        {
          $match: {
            role_last_status: AccessStatus.GRANTED,
            user_last_status: UserEventType.ACTIF,
            role_authorized_type: AccessEntityType.ENTREPRISE,
          },
        },
        {
          $lookup: {
            from: "recruiters",
            let: {
              siret: "$entreprise_siret",
              email: "$user_email",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$establishment_siret", "$$siret"],
                      },
                      {
                        $eq: ["$email", "$$email"],
                      },
                    ],
                  },
                },
              },
            ],
            as: "recruiters",
          },
        },
        {
          $unwind: {
            path: "$recruiters",
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
              entrepris_siret: "$entreprise_siret",
              cfa_enseigne: "$cfa_enseigne",
              cfa_raison_sociale: "$cfa_raison_sociale",
              cfa_siret: "$cfa_siret",
            },
            job_count: {
              $sum: {
                $size: "$recruiters.jobs",
              },
            },
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
            entreprise_siret: "$_id.entreprise_siret",
            cfa_enseigne: "$_id.cfa_enseigne",
            cfa_raison_sociale: "$_id.cfa_raison_sociale",
            cfa_siret: "$_id.cfa_siret",
            job_count: 1,
            _id: 0,
          },
        },
      ])
      .stream()
  }
}

const sendContacts = async (type: AccessEntityType) => {
  const cursor = await getRoleManagement360Stream(type)

  const postingTransform = new Transform({
    objectMode: true,
    transform(contacts, _, callback) {
      postToBrevo(contacts as IBrevoContact[])
      callback()
    },
  })

  await pipeline(cursor, streamGroupByCount(1000), postingTransform)
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
