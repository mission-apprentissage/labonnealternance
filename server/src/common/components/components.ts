// @ts-nocheck
import createMailer from "../mailer.js"
import { connectToMongo } from "../mongodb.js"
import createAppointements from "./appointments.js"
import scan from "./clamav.js"
import createEtablissements from "./etablissement.js"
import createEtablissementRecruteur from "./etablissementRecruteur.js"
import createParcoursupEtablissementStats from "./parcoursupEtablissementStat.js"
import createUsers from "./users.js"
import createEligibleTrainingsForAppointments from "./eligibleTrainingsForAppointments.js"

export default async function (options = {}) {
  const users = await createUsers()
  const appointments = await createAppointements()
  const eligibleTrainingsForAppointments = await createEligibleTrainingsForAppointments()
  const etablissements = await createEtablissements()
  const parcoursupEtablissementStats = await createParcoursupEtablissementStats()
  const etablissementsRecruteur = await createEtablissementRecruteur()

  return {
    db: options.db || (await connectToMongo()).db,
    mailer: options.mailer || createMailer(),
    scan,
    users,
    appointments,
    etablissements,
    eligibleTrainingsForAppointments,
    etablissementsRecruteur,
    parcoursupEtablissementStats,
  }
}
