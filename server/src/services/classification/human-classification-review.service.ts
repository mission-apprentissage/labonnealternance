import { addJob } from "job-processor"
import { JOB_STATUS_ENGLISH } from "shared"
import { COMPUTED_ERROR_SOURCE } from "shared/models/jobs-partners-computed.model"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { syncJobPartnersToSearchItemsInBackground } from "@/services/search/search-items.service"

/**
 * Applique une correction humaine de classification (`cache_classification.human_verification`)
 * et resynchronise les offres concernées : dépublication immédiate si l'offre était déjà en ligne
 * et que la correction la contredit, sinon relance du pipeline (validation + import) pour les
 * offres bloquées dont le business_error vient d'être levé.
 */
export const updateClassificationAndSynchronise = async ({ classification, partner_job_ids }: { classification: "publish" | "unpublish"; partner_job_ids: string[] }) => {
  // update cache_classification
  await getDbCollection("cache_classification").updateMany({ partner_job_id: { $in: partner_job_ids } }, { $set: { human_verification: classification } })
  // get jobs_partners to update offer_status to annulé if classification !== human_verification
  const scopeToUpdate = await getDbCollection("cache_classification")
    .find({ partner_job_id: { $in: partner_job_ids } }, { projection: { partner_job_id: 1, classification: 1, human_verification: 1 } })
    .toArray()
  // filter scopeToUpdate to keep only the jobs where classification !== human_verification
  const filteredScope = scopeToUpdate.filter(({ classification, human_verification }) => classification !== human_verification)
  const filteredScopeIds = filteredScope.map(({ partner_job_id }) => partner_job_id)

  for await (const job of filteredScope) {
    const jobPartners = await getDbCollection("jobs_partners").findOne({ partner_job_id: job.partner_job_id })
    if (jobPartners) {
      await Promise.all([
        getDbCollection("jobs_partners").updateOne(
          { partner_job_id: job.partner_job_id },
          {
            $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE, updated_at: new Date() },
            $push: {
              offer_status_history: {
                date: new Date(),
                status: JOB_STATUS_ENGLISH.ANNULEE,
                reason: "classification humaine non conforme",
                granted_by: "human-classification-review.service",
              },
            },
          }
        ),
        getDbCollection("computed_jobs_partners").updateOne(
          { partner_job_id: job.partner_job_id },
          { $set: { business_error: null, errors: [], validated: false }, $pull: { jobs_in_success: COMPUTED_ERROR_SOURCE.CLASSIFICATION } }
        ),
      ])
      // Après l'update (le sync lit l'état post-annulation) : retrait de l'index de recherche.
      syncJobPartnersToSearchItemsInBackground([jobPartners._id])
    } else {
      const computedJobPartner = await getDbCollection("computed_jobs_partners").findOne({ partner_job_id: job.partner_job_id })
      if (computedJobPartner) {
        await getDbCollection("computed_jobs_partners").updateOne(
          { partner_job_id: job.partner_job_id },
          { $set: { business_error: null, errors: [], validated: false }, $pull: { jobs_in_success: COMPUTED_ERROR_SOURCE.CLASSIFICATION } }
        )
      }
    }
  }
  // Ré-exécute la chaîne de traitement (validation + import vers jobs_partners) pour les offres
  // dont le business_error vient d'être réinitialisé ci-dessus. `queued: true` pour ne pas
  // bloquer l'appelant sur un pipeline potentiellement long. Le nom doit être le nom JS exact de
  // la fonction (`processJobPartnersWithFilter`, enregistrée dans simple-job-definitions.ts) — un
  // nom kebab-case ne correspondant à aucun handler enregistré échouerait silencieusement
  // ("Job not found", capturé par Sentry) sans jamais republier l'offre corrigée.
  if (filteredScopeIds.length) {
    await addJob({ name: "processJobPartnersWithFilter", payload: { partner_job_id: { $in: filteredScopeIds } }, queued: true })
  }
}

/** Point d'entrée CLI (`yarn cli reviewJobPartnersClassification --classification publish
 * --partnerJobIds job1,job2`) pour corriger manuellement la classification d'offres — remplace
 * l'ancien endpoint HTTP POST /classification (supprimé avec le reste du contrôleur, dont le GET
 * ne servait qu'à exporter des données d'entraînement pour le modèle Lab, retiré). */
export const reviewJobPartnersClassification = async (payload?: { classification?: string; partnerJobIds?: string }) => {
  const { classification, partnerJobIds } = payload ?? {}
  if (classification !== "publish" && classification !== "unpublish") {
    throw new Error(`reviewJobPartnersClassification: --classification invalide (attendu "publish" ou "unpublish", reçu ${classification})`)
  }
  const partner_job_ids = (partnerJobIds ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
  if (!partner_job_ids.length) {
    throw new Error("reviewJobPartnersClassification: --partnerJobIds requis (liste de partner_job_id séparés par des virgules)")
  }
  return updateClassificationAndSynchronise({ classification, partner_job_ids })
}
