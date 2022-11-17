import config from "../../config.js"
import createMailer from "../mailer.js"
import { connectToMongo } from "../mongodb.js"
import createApplication from "./application.js"
import createAppointements from "./appointments.js"
import scan from "./clamav.js"
import createEtablissements from "./etablissement.js"
import createEtablissementRecruteur from "./etablissementRecruteur.js"
import createFormulaire from "./formulaire.js"
import createParcoursupEtablissementStats from "./parcoursupEtablissementStat.js"
import createUsers from "./users.js"
import createUserRecruteur from "./usersRecruteur.js"
import createWidgetParameters from "./widgetParameters.js"

export default async function (options = {}) {
  const users = await createUsers()
  const appointments = await createAppointements()
  const widgetParameters = await createWidgetParameters()
  const etablissements = await createEtablissements()
  const parcoursupEtablissementStats = await createParcoursupEtablissementStats()
  const usersRecruteur = await createUserRecruteur()
  const formulaire = await createFormulaire()
  const etablissementsRecruteur = await createEtablissementRecruteur()
  const application = await createApplication()

  return {
    db: options.db || (await connectToMongo()).db,
    mailer: options.mailer || createMailer({ smtp: { ...config.smtp, secure: false } }),
    scan,
    users,
    formulaire,
    application,
    appointments,
    usersRecruteur,
    etablissements,
    widgetParameters,
    etablissementsRecruteur,
    parcoursupEtablissementStats,
  }
}
