import { recreateIndexes } from "@/jobs/database/recreate-indexes"

// crée la collection feedback_forms et ses index, dont l'unicité du slug (issue #5247)
export const up = async () => {
  await recreateIndexes()
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
