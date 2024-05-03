import { Db } from "mongodb"

export const up = async (db: Db) => {
  await db.collection("recruiters").updateMany({}, { $set: { "jobs.$[].is_multi_published": true } })
}
