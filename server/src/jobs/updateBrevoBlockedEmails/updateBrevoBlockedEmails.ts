import SibApiV3Sdk from "sib-api-v3-sdk"

import { logger } from "../../common/logger"
import { EmailBlacklist, LbaCompany } from "../../common/model/index.js"
import { sentryCaptureException } from "../../common/utils/sentryUtils"
import { notifyToSlack } from "../../common/utils/slackUtils"
import config from "../../config"

const saveBlacklistEmails = async (contacts) => {
  for (let i = 0; i < contacts.length; ++i) {
    const email = contacts[i].email
    let blackListedEmail = await EmailBlacklist.findOne({ email })
    if (!blackListedEmail) {
      const companies = await LbaCompany.find({ email })
      await cleanCompanies(companies)

      blackListedEmail = new EmailBlacklist({
        email,
        blacklisting_origin: "brevo",
      })
      await blackListedEmail.save()
      blacklistedAddressCount++
    }
  }
}

const cleanCompanies = async (companies) => {
  if (companies && companies.length) {
    for (let i = 0; i < companies.length; ++i) {
      await cleanCompany(companies[i])
    }
  }
}

const cleanCompany = async (company) => {
  company.email = ""
  await company.save()
  modifiedCompanyCount++
}

const updateBlockedEmails = async ({ AllAddresses }) => {
  logger.info(`Début mise à jour blacklist Brevo`)

  const defaultClient = SibApiV3Sdk.ApiClient.instance
  const apiKey = defaultClient.authentications["api-key"]
  apiKey.apiKey = config.smtp.brevoApiKey

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const todayStr = `${yesterday.getFullYear()}-${yesterday.getMonth() < 9 ? "0" : ""}${yesterday.getMonth() + 1}-${yesterday.getDate() < 10 ? "0" : ""}${yesterday.getDate()}`
  const limit = 100
  const senders = ["no-reply@apprentissage.beta.gouv.fr"]
  let total = 0
  let offset = 0
  const startDate = AllAddresses ? null : todayStr
  const endDate = AllAddresses ? null : todayStr

  const opts = {
    startDate,
    endDate,
    limit,
    offset,
    senders,
  }

  let result = await apiInstance.getTransacBlockedContacts(opts)

  total = result.count

  if (!Number.isFinite(total)) {
    return
  }

  while (offset < total) {
    await saveBlacklistEmails(result.contacts)

    offset += limit
    result = await apiInstance.getTransacBlockedContacts({ ...opts, offset })
  }
}

let blacklistedAddressCount = 0
let modifiedCompanyCount = 0

export default async function ({ AllAddresses }) {
  blacklistedAddressCount = 0
  modifiedCompanyCount = 0

  try {
    logger.info(" -- Import blocked email addresses -- ")

    await updateBlockedEmails({ AllAddresses })

    await notifyToSlack({
      subject: "BREVO",
      message: `Mise à jour des adresses emails bloquées terminée. ${blacklistedAddressCount} adresse(s) bloquée(s). ${modifiedCompanyCount} société(s) impactée(s).`,
    })

    logger.info(`Fin traitement`)
  } catch (error) {
    sentryCaptureException(error)
    logger.error(error)
    await notifyToSlack({ subject: "BREVO", message: `Échec de la mise à jour des adresses emails bloquées` })
  }
}
