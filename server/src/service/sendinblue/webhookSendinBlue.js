import SibApiV3Sdk from "sib-api-v3-sdk"
import { logger } from "../../common/logger.js"
import config from "../../config.js"
const defaultClient = SibApiV3Sdk.ApiClient.instance

let apiKey = defaultClient.authentications["api-key"]
apiKey.apiKey = config.smtp.sendinblueApiKey

let apiInstance = new SibApiV3Sdk.WebhooksApi()

let applicationStatusWebhook = new SibApiV3Sdk.CreateWebhook()

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

const initSendinblueWebhooks = () => {
  apiInstance.createWebhook(applicationStatusWebhook).then(
    function (data) {
      logger.info("Sendinblue webhook API called successfully for application email status changes. Returned data: " + JSON.stringify(data))
    },
    function (error) {
      logger.error("Sendinblue webhook API Error for application email status changes. Returned data: " + error.response.res.text)
    }
  )
  apiInstance.createWebhook(campaignHarbounceWebhook).then(
    function (data) {
      logger.info("Sendinblue webhook API called successfully for campaign hardbounce detection. Returned data: " + JSON.stringify(data))
    },
    function (error) {
      logger.error("Sendinblue webhook API Error for campaign hardbounce detection. Returned data: " + error.response.res.text)
    }
  )
}

export { initSendinblueWebhooks }
