// @ts-nocheck
import createMailer from "../mailer.js"
import { connectToMongo } from "../mongodb.js"
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

  return {
    db: options.db || (await connectToMongo()).db,
    mailer: options.mailer || createMailer(),
    scan,
    users,
    formulaire,
    appointments,
    usersRecruteur,
    etablissements,
    widgetParameters,
    etablissementsRecruteur,
    parcoursupEtablissementStats,
  }
}
