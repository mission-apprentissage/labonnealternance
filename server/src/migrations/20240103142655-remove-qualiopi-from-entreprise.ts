import { Db } from "mongodb"
import { ENTREPRISE } from "shared/constants/recruteur"

export const up = async (db: Db) => {
  await db.collection("userrecruteurs").updateMany({ type: ENTREPRISE }, { $set: { is_qualiopi: false } })
}
