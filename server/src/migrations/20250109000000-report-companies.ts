import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("reported_companies").updateMany(
    {},
    {
      $set: {
        reason: "vide (migration)",
        reasonDetails: null,
        siret: null,
        partnerLabel: null,
        jobTitle: null,
        companyName: null,
      },
    }
  )
}
