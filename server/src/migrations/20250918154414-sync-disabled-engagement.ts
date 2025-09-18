import { EntrepriseEngagementSources } from "shared/models/referentielEngagementEntreprise.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("jobs_partners").updateMany({}, { $set: { contract_is_disabled_elligible: false } })

  const engagementSirets = await getDbCollection("referentiel_engagement_entreprise").distinct("siret", { sources: EntrepriseEngagementSources.FRANCE_TRAVAIL })

  await getDbCollection("jobs_partners").updateMany({ siret: { $in: engagementSirets } }, { $set: { contract_is_disabled_elligible: true } })
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
