import SibApiV3Sdk from "sib-api-v3-sdk"

import { logger } from "../common/logger"
import config from "../config"

const defaultClient = SibApiV3Sdk.ApiClient.instance

const apiKey = defaultClient.authentications["api-key"]
apiKey.apiKey = config.smtp.brevoApiKey

const apiInstance = new SibApiV3Sdk.WebhooksApi()

let applicationStatusWebhook = new SibApiV3Sdk.CreateWebhook()

export const enum BrevoEventStatus {
  HARD_BOUNCE = "hard_bounce",
}

applicationStatusWebhook = {
  description: "Changements d'états des emails de candidatures",
  url: `${config.publicUrl.indexOf("local") >= 0 ? "https://labonnealternance-recette.apprentissage.beta.gouv.fr" : config.publicUrl}/api/application/webhook`,
  events: ["delivered", "hardBounce", "blocked", "invalid", "click", "uniqueOpened"],
  type: "transactional",
}

let campaignHarbounceWebhook = new SibApiV3Sdk.CreateWebhook()

campaignHarbounceWebhook = {
  description: "Traitement des harbounces des emails des campagnes",
  url: `${config.publicUrl.indexOf("local") >= 0 ? "https://labonnealternance-recette.apprentissage.beta.gouv.fr" : config.publicUrl}/api/campaign/webhook`,
  events: ["hardBounce"],
  type: "marketing",
}

/**
 * Initialise les webhooks Brevo au démarrage du docker server. Echoue sans conséquences s'ils existent déjà
 */
export const initBrevoWebhooks = () => {
  if (config.env !== "production") {
    return
  }

  apiInstance.createWebhook(applicationStatusWebhook).then(
    function (data) {
      logger.info("Brevo webhook API called successfully for application email status changes. Returned data: " + JSON.stringify(data))
    },
    function (error) {
      logger.error("Brevo webhook API Error for application email status changes. Returned data: " + error.response.res.text)
    }
  )
  apiInstance.createWebhook(campaignHarbounceWebhook).then(
    function (data) {
      logger.info("Brevo webhook API called successfully for campaign hardbounce detection. Returned data: " + JSON.stringify(data))
    },
    function (error) {
      logger.error("Brevo webhook API Error for campaign hardbounce detection. Returned data: " + error.response.res.text)
    }
  )
}
