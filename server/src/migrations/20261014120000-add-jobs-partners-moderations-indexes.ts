import { recreateIndexes } from "@/jobs/database/recreate-indexes"

// Index de jobs_partners_moderations (#5497) : un index n'est créé en prod que par une migration.
export const up = async () => {
  await recreateIndexes()
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
