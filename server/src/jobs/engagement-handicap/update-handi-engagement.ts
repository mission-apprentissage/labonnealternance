import { EntrepriseEngagementSources } from "shared/models/referentiel-engagement-entreprise.model"
import { validateSIRET } from "shared/validators/siret-validator"

import { logger } from "@/common/logger"
import { s3ReadAsString } from "@/common/utils/aws-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { refreshEntrepriseEngagementJobsPartners } from "@/jobs/engagement-handicap/refresh-entreprise-engagement-jobs-partners"
import { getEntrepriseHandiEngagement, upsertEntrepriseHandiEngagement } from "@/services/referentiel-engagement-entreprise.service"

const S3_KEY = "siretlist/lba_handi_engage_flag.ndjson"

// Le fichier ndjson est supposé contenir une entrée `{ siret: string, ... }` par ligne.
// Hypothèse à vérifier sur un échantillon réel du fichier : nom du champ = "siret" (lowercase).
type HandiEngageFlagDocument = { siret: string }

// SIRET présents en référentiel avec la source FRANCE_TRAVAIL mais absents du fichier S3 téléchargé :
// - source FRANCE_TRAVAIL seule → l'entrée est supprimée
// - sources LBA + FRANCE_TRAVAIL → la source FRANCE_TRAVAIL est retirée, l'entrée (source LBA) est conservée
// (les entrées avec uniquement la source LBA ne sont pas concernées : elles ne sont jamais retournées par ce filtre)
const removeFranceTravailSourceForMissingSirets = async (sirets: Set<string>) => {
  const staleDocs = await getDbCollection("referentiel_engagement_entreprise").find({ engagement: "handicap", sources: EntrepriseEngagementSources.FRANCE_TRAVAIL }).toArray()

  let removed = 0
  let franceTravailSourceRemoved = 0

  for (const doc of staleDocs) {
    if (sirets.has(doc.siret)) continue

    const remainingSources = doc.sources.filter((source) => source !== EntrepriseEngagementSources.FRANCE_TRAVAIL)
    if (remainingSources.length === 0) {
      await getDbCollection("referentiel_engagement_entreprise").deleteOne({ _id: doc._id })
      removed++
    } else {
      await getDbCollection("referentiel_engagement_entreprise").updateOne({ _id: doc._id }, { $set: { sources: remainingSources, updated_at: new Date() } })
      franceTravailSourceRemoved++
    }
  }

  return { removed, franceTravailSourceRemoved }
}

export const updateHandiEngagement = async () => {
  logger.info(`updateHandiEngagement: téléchargement de ${S3_KEY}`)

  const content = await s3ReadAsString("storage", S3_KEY)
  if (!content) {
    logger.warn(`updateHandiEngagement: fichier vide ou introuvable (${S3_KEY})`)
    return
  }

  let created = 0
  let alreadyUpToDate = 0
  let completed = 0
  let errors = 0
  const sirets = new Set<string>()

  for (const line of content.split("\n")) {
    if (!line.trim()) continue
    try {
      const { siret } = JSON.parse(line) as HandiEngageFlagDocument
      if (!validateSIRET(siret)) {
        throw new Error(`SIRET invalide "${siret}"`)
      }
      sirets.add(siret)

      const existing = await getEntrepriseHandiEngagement(siret)

      if (!existing) {
        // Cas 1 - Nouveau SIRET : absent du référentiel → création (created_at = maintenant, engagement = "handicap")
        await upsertEntrepriseHandiEngagement({ siret, sources: [EntrepriseEngagementSources.FRANCE_TRAVAIL] })
        created++
      } else if (existing.sources.includes(EntrepriseEngagementSources.FRANCE_TRAVAIL)) {
        // Cas 2 - Déjà à jour : source France Travail déjà présente → rien à faire
        alreadyUpToDate++
      } else {
        // Cas 3 - Source à compléter : présent (ex. source LBA) mais sans France Travail → on l'ajoute sans écraser les sources existantes
        const sources = [...new Set([...existing.sources, EntrepriseEngagementSources.FRANCE_TRAVAIL])]
        await upsertEntrepriseHandiEngagement({ siret, sources })
        completed++
      }
    } catch (err) {
      logger.error({ err, line }, "updateHandiEngagement: ligne ndjson non traitable")
      errors++
    }
  }

  logger.info(`updateHandiEngagement: ${created} créés, ${alreadyUpToDate} déjà à jour, ${completed} sources complétées, ${errors} erreurs`)

  if (errors === 0 && sirets.size > 0) {
    const { removed, franceTravailSourceRemoved } = await removeFranceTravailSourceForMissingSirets(sirets)
    logger.info(`updateHandiEngagement: ${removed} entrées supprimées, ${franceTravailSourceRemoved} sources France Travail retirées (SIRET absents du fichier)`)
  } else {
    logger.warn(`updateHandiEngagement: contrôle inverse ignoré (errors=${errors}, sirets=${sirets.size})`)
  }

  logger.info(`updateHandiEngagement: mise à jour des offres dans jobs_partners`)
  await refreshEntrepriseEngagementJobsPartners()
  logger.info(`updateHandiEngagement: mise à jour des offres dans jobs_partners terminée`)
}
