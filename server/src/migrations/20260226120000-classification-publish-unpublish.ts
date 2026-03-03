import { getDbCollection } from "@/common/utils/mongodbUtils"

type AnyFilter = any

export const up = async () => {
  const collection = getDbCollection("cache_classification")
  // bypassDocumentValidation is required: the new schema rejects the intermediate state
  // where scores has both old and new keys (additionalProperties: false).
  const opts = { bypassDocumentValidation: true }

  // Migrate all documents in a single pass:
  //   - classification : "cfa" → "unpublish", "entreprise"/"entreprise_cfa" → "publish"
  //   - human_verification : same mapping, null preserved as null
  //   - scores : add publish/unpublish keys computed from old values, remove old keys
  await collection.updateMany(
    {} as AnyFilter,
    [
      {
        $set: {
          classification: { $cond: [{ $eq: ["$classification", "cfa"] }, "unpublish", "publish"] },
          human_verification: {
            $switch: {
              branches: [
                { case: { $eq: ["$human_verification", "cfa"] }, then: "unpublish" },
                { case: { $in: ["$human_verification", ["entreprise", "entreprise_cfa"]] }, then: "publish" },
              ],
              default: null,
            },
          },
          "scores.publish": { $max: ["$scores.entreprise", "$scores.entreprise_cfa"] },
          "scores.unpublish": "$scores.cfa",
        },
      },
      { $unset: ["scores.cfa", "scores.entreprise", "scores.entreprise_cfa"] },
    ] as AnyFilter,
    opts
  )
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
