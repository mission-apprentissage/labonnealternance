// @ts-nocheck
import { connectToMongo } from "../mongodb.js"
import createEtablissements from "./etablissement.js"

export default async function (options = {}) {
  const etablissements = await createEtablissements()

  return {
    db: options.db || (await connectToMongo()).db,
    etablissements,
  }
}
