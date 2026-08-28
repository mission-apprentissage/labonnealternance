import brevo, { CreateWebhook } from "@getbrevo/brevo"
import { internal } from "@hapi/boom"
import type { ColumnOption } from "csv-stringify"
import { stringify } from "csv-stringify/sync"
import dayjs from "shared/helpers/dayjs"

import { logger } from "@/common/logger"
import config from "@/config"

/**
 * Décrit une erreur de l'API Brevo sans reprendre l'objet d'erreur brut.
 *
 * L'erreur levée par le SDK porte `config.data`, c'est-à-dire le corps CSV complet de la requête —
 * adresses email nominatives de recruteurs et de candidats. `extraErrorDataIntegration` la
 * sérialiserait telle quelle dans Sentry (`sendDefaultPii` actif) et aucune clé de ce corps ne
 * correspond au scrub par nom de `sentry.ts`. Constaté en production sur le job « Export contact
 * recruteurs vers Brevo » (Sentry LBA-SERVER-5J7KF4ZZZTAAB).
 *
 * Même logique que les clients france-travail, diagoriente, inserjeunes et api-entreprise.
 */
const describeBrevoError = (error: any): { status: number | undefined; brevoMessage: string | undefined; message: string } => ({
  // Le SDK Brevo expose selon les appels `response.statusCode` (superagent) ou `response.status`
  // (axios) — la boucle de retry ci-dessous lit déjà les deux.
  status: error?.response?.statusCode ?? error?.response?.status,
  brevoMessage: error?.response?.body?.message ?? error?.response?.data?.message,
  message: error?.message ?? "erreur inconnue",
})

const clientBrevo = new brevo.WebhooksApi()
clientBrevo.setApiKey(brevo.WebhooksApiApiKeys.apiKey, config.smtp.brevoApiKey)

export const enum BrevoEventStatus {
  HARDBOUNCE = "hardBounce",
  BLOCKED = "blocked",
  SPAM = "spam",
  UNSUBSCRIBED = "unsubscribed",
  DELIVRE = "delivered",
  ENVOYE = "requete",
  UNIQUE_OPENED = "unique_opened",
  CLIQUE = "click",
}

const emailWebhook = {
  description: "Changements d'états des emails de candidatures ou de rendez-vous ou de marketing",
  url: `${config.publicUrl}/api/emails/webhook?apiKey=${config.smtp.brevoWebhookApiKey}`,
  events: [CreateWebhook.EventsEnum.Delivered, CreateWebhook.EventsEnum.Request, CreateWebhook.EventsEnum.Click, CreateWebhook.EventsEnum.UniqueOpened],
}

const hardBounceWebhook = {
  description: "Hardbounce des emails de candidatures ou de rendez-vous ou de marketing",
  url: `${config.publicUrl}/api/emails/webhookHardbounce?apiKey=${config.smtp.brevoWebhookApiKey}`,
  events: [CreateWebhook.EventsEnum.HardBounce, CreateWebhook.EventsEnum.Blocked, CreateWebhook.EventsEnum.Spam, CreateWebhook.EventsEnum.Unsubscribed],
}

/**
 * Journalise l'échec de création d'un webhook.
 *
 * L'ancienne version lisait `error.response.res.text` sans garde : quand `error.response` est
 * absent (échec réseau, DNS, timeout), le handler de rejet levait lui-même un TypeError que plus
 * rien ne rattrapait — rejet non rattrapé à chaque démarrage du serveur en production, et une
 * nouvelle issue Sentry à chaque release puisque le culprit contient le hash du chunk
 * (LBA-SERVER-5J7KF4ZZZTA8E et 5 issues jumelles).
 */
const logBrevoWebhookError = (webhook: string, error: any): void => {
  const { status, brevoMessage, message } = describeBrevoError(error)
  logger.error(`Brevo webhook API Error for ${webhook}. status=${status ?? "n/a"} message=${brevoMessage ?? message}`)
}

/**
 * Initialise les webhooks Brevo au démarrage du docker server. Echoue sans conséquences s'ils existent déjà
 */
export const initBrevoWebhooks = () => {
  if (config.env !== "production") {
    return
  }

  clientBrevo
    .createWebhook({
      ...emailWebhook,
      type: CreateWebhook.TypeEnum.Transactional,
    })
    .then(
      function (data) {
        logger.info("Brevo webhook API called successfully for email (appointment, application) status changes. Returned data: " + JSON.stringify(data))
      },
      function (error) {
        logBrevoWebhookError("email (appointment, application) status changes", error)
      }
    )

  clientBrevo.createWebhook({ ...hardBounceWebhook, type: CreateWebhook.TypeEnum.Transactional }).then(
    function (data) {
      logger.info("Brevo webhook API called successfully for transactional hardbounces. Returned data: " + JSON.stringify(data))
    },
    function (error) {
      logBrevoWebhookError("transactional hardbounces", error)
    }
  )

  clientBrevo
    .createWebhook({
      ...hardBounceWebhook,
      events: [CreateWebhook.EventsEnum.HardBounce, CreateWebhook.EventsEnum.Spam, CreateWebhook.EventsEnum.Unsubscribed],
      type: CreateWebhook.TypeEnum.Marketing,
    })
    .then(
      function (data) {
        logger.info("Brevo webhook API called successfully for campaign hardbounce detection. Returned data: " + JSON.stringify(data))
      },
      function (error) {
        logBrevoWebhookError("campaign hardbounce detection", error)
      }
    )
}

export const uploadContactListToBrevo = async (account: "TRANSACTIONAL" | "MARKETING", contacts: any[], contactMapper: ColumnOption[], listId: string) => {
  const fileBody = stringify(contacts, {
    delimiter: ";",
    header: true,
    columns: contactMapper,
    cast: {
      date: (value) => dayjs(value).format("YYYY-MM-DD"),
      number: (value) => "" + value || "0",
      string: (value) => value ?? "",
    },
  })

  const clientBrevo = new brevo.ContactsApi()
  clientBrevo.setApiKey(brevo.ContactsApiApiKeys.apiKey, account === "TRANSACTIONAL" ? config.smtp.brevoApiKey : config.smtp.brevoMarketingApiKey)

  const requestContactImport = new brevo.RequestContactImport()

  requestContactImport.fileBody = fileBody
  requestContactImport.updateExistingContacts = true
  requestContactImport.emptyContactsAttributes = true

  requestContactImport.listIds = [parseInt(listId)]

  const maxRetries = 5
  let attempt = 0
  let lastError: unknown = null

  // Ne jamais relever l'erreur du SDK telle quelle : elle porte le corps CSV de l'import
  // (cf. describeBrevoError). On la remplace par un Boom qui ne retient que le statut, le message
  // renvoyé par Brevo, la liste ciblée et le nombre de contacts.
  const toImportError = (error: unknown) => {
    const { status, brevoMessage, message } = describeBrevoError(error)
    return internal(`brevo: échec de l'import de contacts (${brevoMessage ?? message})`, { account, listId, status, contactCount: contacts.length })
  }

  while (attempt < maxRetries) {
    try {
      await clientBrevo.importContacts(requestContactImport)
      return
    } catch (error: any) {
      lastError = error
      const statusCode = error?.response?.statusCode || error?.response?.status

      if (statusCode === 429) {
        attempt++
        if (attempt < maxRetries) {
          const headers = error?.response?.headers || {}
          const rateLimitReset = headers["x-sib-ratelimit-reset"]
          const rateLimitRemaining = headers["x-sib-ratelimit-remaining"]

          // Use Brevo's x-sib-ratelimit-reset header (time in ms until reset) or fallback to exponential backoff
          // Brevo rate limit: 10 RPS, so wait at least 100ms between retries
          // Exponential backoff: 100ms, 200ms, 500ms, 1s, 2s
          const parsed = parseInt(rateLimitReset)
          const backoffMs = Math.min(100 * Math.pow(2, attempt - 1), 2000)
          const delayMs = !isNaN(parsed) && parsed > 0 ? Math.min(parsed, 30_000) : backoffMs

          logger.warn(`Brevo API rate limit reached (429). Remaining: ${rateLimitRemaining || "unknown"}. Retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries})`)
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        } else {
          logger.error(`Brevo API rate limit reached. Max retries (${maxRetries}) exceeded`)
          throw toImportError(error)
        }
      } else {
        throw toImportError(error)
      }
    }
  }

  throw toImportError(lastError)
}
