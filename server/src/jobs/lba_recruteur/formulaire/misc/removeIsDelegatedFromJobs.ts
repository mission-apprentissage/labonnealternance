import { mongooseInstance } from "../../../../common/mongodb"

export const removeIsDelegatedFromJobs = async () => {
  const db = mongooseInstance.connection

  // @ts-ignore
  await db.collection("recruiters").updateMany(
    { "jobs.is_delegated": { $exists: true } },
    {
      $unset: { "jobs.$[].is_delegated": "" },
    }
  )
}
