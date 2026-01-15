import type { Db } from "mongodb"
import { importReferentielRome } from "@/jobs/referentielRome/referentielRome"

export const up = async (_db: Db) => {
  await importReferentielRome()
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = true
