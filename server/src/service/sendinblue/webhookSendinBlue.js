import config from "../../config.js";
import SibApiV3Sdk from "sib-api-v3-sdk";
const defaultClient = SibApiV3Sdk.ApiClient.instance;
import { logger } from "../../common/logger.js";

let apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = config.smtp.sendinblueApiKey;

let apiInstance = new SibApiV3Sdk.WebhooksApi();

let createWebhook = new SibApiV3Sdk.CreateWebhook();

createWebhook = {
  description: "Changement d'état de candidature LBA",
  url: `${
    config.publicUrl.indexOf("local") >= 0
      ? "https://labonnealternance-recette.apprentissage.beta.gouv.fr"
      : config.publicUrl
  }/api/application/webhook`,
  events: ["delivered", "hardBounce", "blocked", "invalid", "click", "uniqueOpened"],
  type: "transactional",
};

const initWebhook = () => {
  apiInstance.createWebhook(createWebhook).then(
    function (data) {
      logger.info("Sendinblue webhook API called successfully. Returned data: " + JSON.stringify(data));
    },
    function (error) {
      logger.error("Sendinblue webhook API Error. Returned data: " + error.response.res.text);
    }
  );
};

export { initWebhook };
