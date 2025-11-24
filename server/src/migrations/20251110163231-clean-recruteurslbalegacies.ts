import type { Db } from "mongodb"

export const up = async (db: Db) => {
  try {
    await db.collection("recruteurslbalegacies").drop()
  } catch (err) {
    // Collection may not exist, which is acceptable
    console.log(err)
  }
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
