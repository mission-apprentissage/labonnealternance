import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("etablissements").updateMany(
    { premium_affelnet_invitation_date: { $ne: null }, premium_affelnet_activation_date: null },
    { $set: { premium_affelnet_invitation_date: null, premium_affelnet_refusal_date: null } }
  )
  await getDbCollection("etablissements").updateMany(
    { premium_invitation_date: { $ne: null }, premium_activation_date: null },
    { $set: { premium_invitation_date: null, premium_refusal_date: null } }
  )
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
