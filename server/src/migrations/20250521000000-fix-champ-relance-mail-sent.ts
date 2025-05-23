import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("recruiters").updateMany(
    {},
    {
      $unset: {
        "jobs.$[].relance_mail_sent": "",
      },
    }
  )
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
