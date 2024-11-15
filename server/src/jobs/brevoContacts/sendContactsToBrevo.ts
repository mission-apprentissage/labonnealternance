import { Transform } from "stream"
import { pipeline } from "stream/promises"

import dayjs from "dayjs"
import { /*AccessEntityType, */ AccessStatus } from "shared/models"
import { UserEventType } from "shared/models/userWithAccount.model"
import SibApiV3Sdk from "sib-api-v3-sdk"

import { logger } from "@/common/logger"
import { ensureInitialization } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import config from "@/config"

// type IBrevoContact = {
//   user_origin: string
//   user_first_name: string            PRENOM
//   user_last_name: string             NOM
//   user_email: string                 EMAIL
//   role_createdAt: Date
//   role_authorized_type: AccessEntityType.CFA | AccessEntityType.ENTREPRISE
//   entreprise_enseigne?: string | null | undefined
//   entreprise_raison_sociale?: string | null | undefined
//   cfa_enseigne?: string | null | undefined
//   cfa_raison_sociale?: string | null | undefined
//   job_count?: string | null | undefined
// }

let batch = []
let contactCount = 0

const chunkTransform = new Transform({
  objectMode: true,
  transform(contact, _, callback) {
    batch.push(contact)

    if (batch.length === 1000) {
      postToBrevo(batch)
      callback()
      batch = []
    } else {
      callback()
    }
  },
  flush(callback) {
    if (batch && batch.length > 0) {
      postToBrevo(batch)
    }
    callback()
  },
})

const postToBrevo = async (contacts) => {
  contactCount += contacts.length
  console.log("last stage doc", contacts.length, contacts[0].user_email, contacts.at(-1).user_email)

  //console.log("contacts : ", contacts.length, contacts.length ? contacts[0] : null)

  const defaultClient = SibApiV3Sdk.ApiClient.instance
  const apiKey = defaultClient.authentications["api-key"]
  apiKey.apiKey = config.smtp.brevoApiKey
  const apiInstance = new SibApiV3Sdk.ContactsApi()

  const requestContactImport = new SibApiV3Sdk.RequestContactImport()

  requestContactImport.fileBody =
    "EMAIL;PRENOM;NOM;USER_ORIGIN;ROLE_AUTHORIZED_TYPE;ROLE_CREATEDAT;ENTREPRISE_ENSEIGNE;ENTREPRISE_RAISON_SOCIALE;CFA_ENSEIGNE;CFA_RAISON_SOCIALE;JOB_COUNT\n"
  contacts.forEach((contact) => {
    requestContactImport.fileBody += `${contact.user_email};${contact.user_first_name};${contact.user_last_name};${contact.user_origin ?? ""};${contact.role_authorized_type ?? ""};${dayjs(contact.role_createdAt).format("YYYY-MM-DD")};${contact.entreprise_enseigne ?? ""};${contact.entreprise_raison_sociale ?? ""};${contact.cfa_enseigne ?? ""};${contact.cfa_raison_sociale ?? ""};0\n`
  })
  requestContactImport.listIds = [5]
  requestContactImport.updateExistingContacts = true
  requestContactImport.emptyContactsAttributes = true

  apiInstance.importContacts(requestContactImport).then(
    function (data) {
      console.log("API called successfully. Returned data: " + JSON.stringify(data))
    },
    function (error) {
      console.error(error)
    }
  )
}

export const sendContactsToBrevo = async () => {
  logger.info("Sending contacts to Brevo ...")

  try {
    const cursor = await ensureInitialization()
      .db()
      .collection("rolemanagement360")
      .find(
        { role_last_status: AccessStatus.GRANTED, user_last_status: UserEventType.ACTIF },
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
    await pipeline(cursor, chunkTransform)

    console.log("All documents processed!")

    await notifyToSlack({
      subject: `Envoi des contacts vers Brevo`,
      message: `${contactCount} envoyés vers Brevo.`,
      error: contactCount === 0,
    })
  } catch (err) {
    console.log("rpout ", err)
    await notifyToSlack({ subject: "Envoi des contacts vers Brevo", message: `ECHEC envoi des contacts vers Brevo`, error: true })
    throw err
  }

  logger.info("contacts sent to brevo")
}

// const defaultClient = SibApiV3Sdk.ApiClient.instance
//   const apiKey = defaultClient.authentications["api-key"]
//   apiKey.apiKey = config.smtp.brevoApiKey

//   const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()
// let result = await apiInstance.getTransacBlockedContacts(opts)

//   total = result.count

//   if (!Number.isFinite(total)) {
//     return
//   }const SibApiV3Sdk = require('sib-api-v3-sdk');
// let defaultClient = SibApiV3Sdk.ApiClient.instance;

// let apiKey = defaultClient.authentications['api-key'];
// apiKey.apiKey = 'YOUR API KEY';

// let apiInstance = new SibApiV3Sdk.AttributesApi();
// apiInstance.getAttributes().then(function(data) {
//   console.log('API called successfully. Returned data: ' + JSON.stringify(data));
// }, function(error) {
//   console.error(error);
// });

//   while (offset < total) {
//     await saveBlacklistEmails(result.contacts)

//     offset += limit
//     result = await apiInstance.getTransacBlockedContacts({ ...opts, offset })
//   }
