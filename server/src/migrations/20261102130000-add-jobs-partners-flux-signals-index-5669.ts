import { getDbCollection } from "@/common/utils/mongodb-utils"

// Index unique de jobs_partners_flux_signals (#5669) : un index n'est créé en prod que par une migration.
// createIndex plutôt que recreateIndexes, qui relancerait aussi la création des index mongot.
export const up = async () => {
  await getDbCollection("jobs_partners_flux_signals").createIndex({ partner_label: 1 }, { unique: true })
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
