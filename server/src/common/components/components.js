import { connectToMongo } from "../mongodb.js";
import createMailer from "../mailer.js";
import scan from "./clamav.js";
import config from "../../config.js";
import createUsers from "./users.js";
import createWidgetParameters from "./widgetParameters.js";
import createAppointements from "./appointments.js";
import createEtablissements from "./etablissement.js";
import createParcoursupEtablissementStats from "./parcoursupEtablissementStat.js";

export default async function (options = {}) {
  const users = createUsers();
  const appointments = createAppointements();
  const widgetParameters = createWidgetParameters();
  const etablissements = createEtablissements();
  const parcoursupEtablissementStats = createParcoursupEtablissementStats();

  return {
    db: options.db || (await connectToMongo()).db,
    mailer: options.mailer || createMailer({ smtp: { ...config.private.smtp, secure: false } }),
    scan,
    users,
    appointments,
    widgetParameters,
    etablissements,
    parcoursupEtablissementStats,
  };
}
