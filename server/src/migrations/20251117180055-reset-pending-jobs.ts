import type { Db } from "mongodb"

export const up = async (db: Db) => {
  await db.collection("job_processor.jobs").deleteMany({ status: "pending" })
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = true
