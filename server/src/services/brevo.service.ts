import brevo, { CreateWebhook } from "@getbrevo/brevo"

import { logger } from "../common/logger"
import config from "../config"

const clientBrevo = new brevo.WebhooksApi()
clientBrevo.setApiKey(brevo.WebhooksApiApiKeys.apiKey, config.smtp.brevoApiKey)

export const enum BrevoEventStatus {
  HARD_BOUNCE = "hard_bounce",
  HARDBOUNCE_WEBHOOK_INIT = "hardBounce",
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
