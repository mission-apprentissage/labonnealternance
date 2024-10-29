import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("recruiters").updateMany({}, { $unset: { "jobs.$[].is_multi_published": "" } }, { bypassDocumentValidation: true })
}
