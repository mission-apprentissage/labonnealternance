import config from "../../config.js";
const axios = require("axios");

const notifyToSlack = async (message) => {
  await axios.post(config.private.jobSlackWebhook, {
    text: `[LBA - ${config.env.toUpperCase()}] ${message}`,
  });
};

export {
  notifyToSlack,
};
