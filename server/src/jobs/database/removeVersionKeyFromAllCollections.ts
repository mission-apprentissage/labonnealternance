import { mongooseInstance } from "../../common/mongodb"

/**
 * Remove the "__v" key from all collections.
 */
export const removeVersionKeyFromAllCollections = async () => {
  const db = mongooseInstance.connection

  for (const collection of Object.keys(db.collections)) {
    // @ts-ignore
    await db.collection(collection).updateMany(
      {},
      {
        $unset: { __v: "" },
      }
    )
  }
}
