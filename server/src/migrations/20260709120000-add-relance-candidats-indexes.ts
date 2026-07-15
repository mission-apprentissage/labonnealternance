import { recreateIndexes } from "@/jobs/database/recreateIndexes"

export const up = async () => {
  await recreateIndexes()
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
