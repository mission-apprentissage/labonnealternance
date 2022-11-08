import axios from "axios";
import config from "../../config.js";

const notifyToSlack = async (message) => {
  await axios.post(config.jobSlackWebhook, {
    text: `[LBA - ${config.env.toUpperCase()}] ${message}`,
  });
};

export { notifyToSlack };
