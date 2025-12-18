import type { Db } from "mongodb"

export const up = async (db: Db) => {
  try {
    const result = await db.collection("job_processor.jobs").deleteMany({ status: "pending" })
    console.info(`Deleted ${result.deletedCount} pending jobs`)
  } catch (err) {
    console.error("Failed to delete pending jobs:", err)
    throw err
  }
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = true
