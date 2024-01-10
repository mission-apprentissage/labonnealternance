import { Db } from "mongodb"

export const up = async (db: Db) => await db.collection("etablissements").updateMany({ affelnet_perimetre: null }, { $set: { affelnet_perimetre: false } })
