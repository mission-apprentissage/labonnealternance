// @ts-nocheck
import { connectToMongo } from "../mongodb.js"
import createEtablissements from "./etablissement.js"

export const components = async (options = {}) => {
  const etablissements = await createEtablissements()

  return {
    db: options.db || (await connectToMongo()).db,
    etablissements,
  }
}

export type Components = Awaited<ReturnType<typeof components>>

export default components
