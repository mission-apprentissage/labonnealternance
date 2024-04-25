import { Db } from "mongodb"
import { JOB_STATUS } from "shared"

export const up = async (db: Db) => {
  await db.collection("recruiters").updateMany({ origin: "pass" }, { $set: { "jobs.$[].job_status": JOB_STATUS.ANNULEE } })
}
