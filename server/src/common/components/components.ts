// @ts-nocheck
// import { connectToMongo } from "../mongodb"

import mongoose from "mongoose"

import createEtablissements from "./etablissement"

export const components = async (options = {}) => {
  const etablissements = await createEtablissements()

  return {
    db: options.db || mongoose.connection, // (await connectToMongo()).db,
    etablissements,
  }
}

export type Components = Awaited<ReturnType<typeof components>>

export default components
