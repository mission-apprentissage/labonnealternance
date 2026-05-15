import he from "he"
import { getDbCollection } from "@/common/utils/mongodbUtils"

const HTML_ENTITY_REGEX = /&(?:[a-zA-Z]+|#[0-9]+|#x[0-9a-fA-F]+);/

const decodeIteratively = (value: string | null | undefined): string | null => {
  if (!value) return value ?? null
  let current = value
  for (let i = 0; i < 5; i++) {
    const decoded = he.decode(current)
    if (decoded === current) break
    current = decoded
  }
  return current === value ? value : current
}

const fixCollection = async (collectionName: "jobs_partners" | "computed_jobs_partners", fields: string[]) => {
  const collection = getDbCollection(collectionName)
  const cursor = collection.find({
    $or: fields.map((f) => ({ [f]: HTML_ENTITY_REGEX })),
  })

  const bulkOps: Array<Parameters<typeof collection.bulkWrite>[0][number]> = []

  for await (const doc of cursor) {
    const update: Record<string, string> = {}
    for (const field of fields) {
      const original = doc[field] as string | null | undefined
      const decoded = decodeIteratively(original)
      if (decoded !== original) update[field] = decoded!
    }
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

export const up = async () => {
  await fixCollection("jobs_partners", ["offer_title", "workplace_name"])
  await fixCollection("computed_jobs_partners", ["offer_title", "workplace_name"])
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
