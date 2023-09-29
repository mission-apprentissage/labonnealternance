import { mongooseInstance } from "../../../../common/mongodb"

export const removeVersionKeyFromRecruiters = async () => {
  const db = mongooseInstance.connection

  // @ts-ignore
  await db.collection("recruiters").updateMany(
    {},
    {
      $unset: { __v: "" },
    }
  )
}
