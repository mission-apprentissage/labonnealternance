import { addJob } from "job-processor"

import { recreateIndexes } from "@/jobs/database/recreate-indexes"

// Index de referentiel_rome_naf et applicants.createdAt (#5688) : un index n'est créé en prod que par une migration.
// L'import est mis en file plutôt qu'exécuté : un fichier S3 absent ou invalide ne doit pas bloquer le déploiement.
// Sans lui, le référentiel reste vide jusqu'au cron du mardi (cf. processSuggestionsNafForWindow).
export const up = async () => {
  await recreateIndexes()
  await addJob({ name: "importReferentielRomeNaf", queued: true, payload: {} })
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
