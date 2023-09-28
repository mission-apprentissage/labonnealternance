import { mongooseInstance } from "../../../../common/mongodb"
import { runScript } from "../../../scriptWrapper"

export const removeIsDelegatedFromJobs = async () => {
  const db = mongooseInstance.connection

  // @ts-expect-error
  await db.collection("recruiters").updateMany({ "jobs.is_delegated": { $exists: true } }, [
    {
      $unset: { "jobs.$[].is_delegated": "" },
    },
  ])
}

runScript(async () => await removeIsDelegatedFromJobs())
