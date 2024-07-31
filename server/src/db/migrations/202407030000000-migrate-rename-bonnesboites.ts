import { Db } from "mongodb"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  logger.info("202407030000000-migrate-rename-bonnesboites started")

  const renameCollectionIfNecessary = async (db, oldName, newName) => {
    const collections = await db.listCollections({ name: newName }).toArray()
    if (collections.length === 0) {
      await db.collection(oldName).rename(newName)
      console.log(`Renamed collection ${oldName} to ${newName}`)
    } else {
      console.log(`Collection ${newName} already exists, skipping rename of ${oldName}`)
    }
  }

  await renameCollectionIfNecessary(db, "bonnesboites", "recruteurslba")
  await renameCollectionIfNecessary(db, "unsubscribedbonnesboites", "unsubscribedrecruteurslba")
  await renameCollectionIfNecessary(db, "bonnesboiteslegacies", "recruteurslbalegacies")

  logger.info("202407030000000-migrate-rename-bonnesboites ended")
}
