// @ts-nocheck
import { connectToMongo } from "../mongodb.js"

export const components = async (options = {}) => {
  return {
    db: options.db || (await connectToMongo()).db,
  }
}

export type Components = Awaited<ReturnType<typeof components>>

export default components
