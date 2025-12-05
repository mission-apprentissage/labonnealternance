import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("userswithaccounts").updateMany(
    // @ts-expect-error
    { last_action_date: null },
    [{ $set: { last_action_date: "$updatedAt" } }]
  )
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
