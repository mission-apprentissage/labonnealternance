import SibApiV3Sdk from "sib-api-v3-sdk"

import { logger } from "../common/logger"
import config from "../config"

const defaultClient = SibApiV3Sdk.ApiClient.instance

const apiKey = defaultClient.authentications["api-key"]
apiKey.apiKey = config.smtp.brevoApiKey

const apiInstance = new SibApiV3Sdk.WebhooksApi()

let emailWebhook = new SibApiV3Sdk.CreateWebhook()

let hardBounceWebhook = new SibApiV3Sdk.CreateWebhook()

export const enum BrevoEventStatus {
  HARD_BOUNCE = "hard_bounce",
  HARDBOUNCE_WEBHOOK_INIT = "hardBounce",
  BLOCKED = "blocked",
  SPAM = "spam",
  UNSUBSCRIBED = "unsubscribed",
}

emailWebhook = {
  description: "Changements d'états des emails de candidatures ou de rendez-vous ou de marketing",
  url: `${config.publicUrl}/api/emails/webhook?apiKey=${config.smtp.brevoWebhookApiKey}`,
  events: ["delivered", "request", "click", "uniqueOpened"],
}

hardBounceWebhook = {
  description: "Hardbounce des emails de candidatures ou de rendez-vous ou de marketing",
  url: `${config.publicUrl}/api/emails/webhookHardbounce?apiKey=${config.smtp.brevoWebhookApiKey}`,
  events: [BrevoEventStatus.HARDBOUNCE_WEBHOOK_INIT, BrevoEventStatus.BLOCKED, BrevoEventStatus.SPAM, BrevoEventStatus.UNSUBSCRIBED],
}

/**
 * Initialise les webhooks Brevo au démarrage du docker server. Echoue sans conséquences s'ils existent déjà
 */
export const initBrevoWebhooks = () => {
  if (config.env !== "production") {
    return
  }

  apiInstance.createWebhook({ ...emailWebhook, type: "transactional" }).then(
    function (data) {
      logger.info("Brevo webhook API called successfully for email (appointment, application) status changes. Returned data: " + JSON.stringify(data))
    },
    function (error) {
      logger.error("Brevo webhook API Error for email (appointment, application) status changes. Returned data: " + error.response.res.text)
    }
  )

  apiInstance.createWebhook({ ...hardBounceWebhook, type: "transactional" }).then(
    function (data) {
      logger.info("Brevo webhook API called successfully for transactional hardbounces. Returned data: " + JSON.stringify(data))
    },
    function (error) {
      logger.error("Brevo webhook API Error for transactional hardbounces. Returned data: " + error.response.res.text)
    }
  )

  apiInstance
    .createWebhook({
      ...hardBounceWebhook,
      events: [BrevoEventStatus.HARDBOUNCE_WEBHOOK_INIT, BrevoEventStatus.SPAM, BrevoEventStatus.UNSUBSCRIBED],
      type: "marketing",
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
