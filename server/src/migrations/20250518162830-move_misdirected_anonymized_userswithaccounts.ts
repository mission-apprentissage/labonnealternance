import { Db } from "mongodb"
import anonymizedUsersWithAccountsModel from "shared/models/anonymizedUsersWithAccounts.model"

export const up = async (db: Db) => {
  // migrate data from anonymizeduserwithaccounts to anonymized_userswithaccounts
  const anonymizeduserwithaccounts = await db.collection("anonymizeduserswithaccounts").find({}).toArray()
  await db.collection(anonymizedUsersWithAccountsModel.collectionName).insertMany(anonymizeduserwithaccounts)

  // remove misnamed collection
  await db.collection("anonymizeduserswithaccounts").drop()
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
