import brevo, { CreateWebhook } from "@getbrevo/brevo"
import type { ColumnOption } from "csv-stringify"
import { stringify } from "csv-stringify/sync"
import dayjs from "shared/helpers/dayjs"

import { logger } from "@/common/logger"
import config from "@/config"

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
        logger.error("Brevo webhook API Error for email (appointment, application) status changes. Returned data: " + error.response.res.text)
      }
    )

  clientBrevo.createWebhook({ ...hardBounceWebhook, type: CreateWebhook.TypeEnum.Transactional }).then(
    function (data) {
      logger.info("Brevo webhook API called successfully for transactional hardbounces. Returned data: " + JSON.stringify(data))
    },
    function (error) {
      logger.error("Brevo webhook API Error for transactional hardbounces. Returned data: " + error.response.res.text)
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
        logger.error("Brevo webhook API Error for campaign hardbounce detection. Returned data: " + error.response.res.text)
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
  let lastError: Error | null = null

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
          const delayMs = rateLimitReset ? parseInt(rateLimitReset) : Math.min(100 * Math.pow(2, attempt - 1), 2000)

          logger.warn(`Brevo API rate limit reached (429). Remaining: ${rateLimitRemaining || "unknown"}. Retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries})`)
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        } else {
          logger.error(`Brevo API rate limit reached. Max retries (${maxRetries}) exceeded`)
          throw error
        }
      } else {
        throw error
      }
    }
  }

  throw lastError
}
