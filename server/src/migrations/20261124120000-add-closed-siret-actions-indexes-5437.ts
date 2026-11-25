import { recreateIndexes } from "@/jobs/database/recreate-indexes"

// Index de closed_siret_actions (#5437) : un index n'est créé en prod que par une migration.
export const up = async () => {
  await recreateIndexes()
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
