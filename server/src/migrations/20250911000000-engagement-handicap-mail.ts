import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  console.info("début de 20250911000000-engagement-handicap-mail.ts")
  const now = new Date()
  await getDbCollection("rolemanagements").updateMany(
    {},
    {
      $set: {
        engagementHandicapEmail: {
          date: now,
          messageId: "migration",
        },
      },
    }
  )
  console.info("fin de 20250911000000-engagement-handicap-mail.ts")
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
