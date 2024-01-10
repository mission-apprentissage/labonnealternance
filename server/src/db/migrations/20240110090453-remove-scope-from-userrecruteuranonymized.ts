import { Db } from "mongodb"

export const up = async (db: Db) => db.collection("anonymizeduserrecruteurs").updateMany({}, { $unset: { scope: "" } })
