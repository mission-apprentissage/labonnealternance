import Sentry from "@sentry/node"
import { BonnesBoites, EmailBlacklist } from "../../common/model/index.js"
import { notifyToSlack } from "../../common/utils/slackUtils.js"
import config from "../../config.js"

import SibApiV3Sdk from "sib-api-v3-sdk"
import { logger } from "../../common/logger.js"

const saveBlacklistEmails = async (contacts) => {
  for (let i = 0; i < contacts.length; ++i) {
    let email = contacts[i].email
    let blackListedEmail = await EmailBlacklist.findOne({ email })
    if (!blackListedEmail) {
      let companies = await BonnesBoites.find({ email })
      await cleanCompanies(companies)

      blackListedEmail = new EmailBlacklist({
        email,
        source: "sendinblue",
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

const updateBlockedEmails = async ({ query }) => {
  logger.info(`Début mise à jour blacklist sendinblue`)

  let defaultClient = SibApiV3Sdk.ApiClient.instance
  let apiKey = defaultClient.authentications["api-key"]
  apiKey.apiKey = config.smtp.sendinblueApiKey

  let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()

  let yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const todayStr = `${yesterday.getFullYear()}-${yesterday.getMonth() < 9 ? "0" : ""}${yesterday.getMonth() + 1}-${yesterday.getDate() < 10 ? "0" : ""}${yesterday.getDate()}`
  const limit = 100
  const senders = ["no-reply@apprentissage.beta.gouv.fr"]
  let total = 0
  let offset = 0
  let startDate = query.all ? null : todayStr
  let endDate = query.all ? null : todayStr

  let opts = {
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

export default async function ({ query }) {
  blacklistedAddressCount = 0
  modifiedCompanyCount = 0

  try {
    logger.info(" -- Import blocked email addresses -- ")

    await updateBlockedEmails({ query })

    await notifyToSlack({
      subject: "SENDINBLUE",
      message: `Mise à jour des adresses emails bloquées terminée. ${blacklistedAddressCount} adresse(s) bloquée(s). ${modifiedCompanyCount} société(s) impactée(s).`,
    })

    logger.info(`Fin traitement`)
  } catch (error) {
    Sentry.captureException(error)
    logger.error(error)
    await notifyToSlack({ subject: "SENDINBLUE", message: `Échec de la mise à jour des adresses emails bloquées` })
  }
}
