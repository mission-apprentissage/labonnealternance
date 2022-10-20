import { connectToMongo } from "../mongodb.js";
import createMailer from "../mailer.js";
import scan from "./clamav.js";
import config from "../../config.js";

export default async function(options = {}) {
  return {
    db: options.db || (await connectToMongo()).db,
    mailer: options.mailer || createMailer({ smtp: { ...config.private.smtp, secure: false } }),
    scan,
  };
};
