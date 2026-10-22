import { recreateIndexes } from "@/jobs/database/recreate-indexes"

// Index de referentiel_rome_naf et applicants.createdAt (#5688) : un index n'est créé en prod que par une migration.
export const up = async () => {
  await recreateIndexes()
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
