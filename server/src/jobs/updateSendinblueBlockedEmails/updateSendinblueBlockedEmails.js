import _ from "lodash-es"
import { BonnesBoites, EmailBlacklist } from "../../common/model/index.js"
import { logMessage } from "../../common/utils/logMessage.js"
import { notifyToSlack } from "../../common/utils/slackUtils.js"
import config from "../../config.js"

import SibApiV3Sdk from "sib-api-v3-sdk"

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
  logMessage("info", `Début mise à jour blacklist sendinblue`)

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

let running = false
let blacklistedAddressCount = 0
let modifiedCompanyCount = 0

export default async function ({ query }) {
  if (!running) {
    running = true
    blacklistedAddressCount = 0
    modifiedCompanyCount = 0

    try {
      logMessage("info", " -- Import blocked email addresses -- ")

      await updateBlockedEmails({ query })

      logMessage("info", `Fin traitement`)

      notifyToSlack(`Mise à jour des adresses emails bloquées terminée. ${blacklistedAddressCount} adresse(s) bloquée(s). ${modifiedCompanyCount} société(s) impactée(s).`)

      running = false

      return {
        result: "Mise à jour des adresses emails bloquées terminée",
      }
    } catch (err) {
      logMessage("error", err)
      let error_msg = _.get(err, "meta.body") ?? err.message
      running = false
      notifyToSlack(`ECHEC mise à jour des adresses emails bloquées. ${error_msg}`)
      return { error: error_msg }
    }
  } else {
    logMessage("info", "Mise à jour des adresses emails bloquées déjà en cours")
  }
}
