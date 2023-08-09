// @ts-nocheck
import { connectToMongo } from "../../db/mongodb.js"

export default async function (options = {}) {
  return {
    db: options.db || (await connectToMongo()).db,
  }
}
