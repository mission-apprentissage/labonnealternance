import { connectToMongo } from "../mongodb.js";
import createMailer from "../mailer.js";
import scan from "./clamav.js";
import config from "../../config.js";
import createUsers from "./users";
import createWidgetParameters from "./widgetParameters";
import createAppointements from "./appointments";
import createEtablissements from "./etablissement";
import createParcoursupEtablissementStats from "./parcoursupEtablissementStat";

export default async function (options = {}) {
  const users = await createUsers();
  const appointments = await createAppointements();
  const widgetParameters = await createWidgetParameters();
  const etablissements = await createEtablissements();
  const parcoursupEtablissementStats = await createParcoursupEtablissementStats();

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
