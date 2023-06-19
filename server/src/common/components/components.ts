// @ts-nocheck
import createMailer from "../mailer.js"
import { connectToMongo } from "../mongodb.js"
import createEtablissements from "./etablissement.js"
import createEtablissementRecruteur from "./etablissementRecruteur.js"
import createUserRecruteur from "./usersRecruteur.js"

export default async function (options = {}) {
  const etablissements = await createEtablissements()
  const usersRecruteur = await createUserRecruteur()
  const etablissementsRecruteur = await createEtablissementRecruteur()

  return {
    db: options.db || (await connectToMongo()).db,
    mailer: options.mailer || createMailer(),
    usersRecruteur,
    etablissements,
    etablissementsRecruteur,
  }
}
