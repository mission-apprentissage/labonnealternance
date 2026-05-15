import he from "he"
import { getDbCollection } from "@/common/utils/mongodbUtils"

const decodeEntities = (value: string | null | undefined): string | null => {
  if (!value) return value ?? null
  const decoded = he.decode(value)
  return decoded === value ? value : decoded
}

export const up = async () => {
  const collection = getDbCollection("jobs_partners")
  const cursor = collection.find({
    $or: [{ offer_title: /&[a-z]+;|&#\d+;/ }, { workplace_name: /&[a-z]+;|&#\d+;/ }],
  })

  const bulkOps: object[] = []

  for await (const doc of cursor) {
    const update: Record<string, string> = {}
    const decodedTitle = decodeEntities(doc.offer_title)
    const decodedName = decodeEntities(doc.workplace_name)
    if (decodedTitle !== doc.offer_title) update["offer_title"] = decodedTitle!
    if (decodedName !== doc.workplace_name) update["workplace_name"] = decodedName!
    if (Object.keys(update).length) {
      bulkOps.push({ updateOne: { filter: { _id: doc._id }, update: { $set: update } } })
    }
    if (bulkOps.length >= 500) {
      await collection.bulkWrite(bulkOps.splice(0))
    }
  }

  if (bulkOps.length) {
    await collection.bulkWrite(bulkOps)
  }
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
