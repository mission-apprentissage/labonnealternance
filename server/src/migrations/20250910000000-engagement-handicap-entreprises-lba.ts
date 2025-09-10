import entrepriseModel, { EntrepriseEngagementHandicapOrigin } from "shared/models/entreprise.model"
import recruiterModel from "shared/models/recruiter.model"
import referentielEngagementEntrepriseModel from "shared/models/referentielEngagementEntreprise.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  console.info("début de 20250910000000-engagement-handicap-entreprises-lba.ts")
  console.info("updating engagement LBA")
  const recruiters = await getDbCollection(recruiterModel.collectionName)
    .find({
      "jobs.is_disabled_elligible": true,
    })
    .toArray()
  const lbaSirets = recruiters.map((recruiter) => recruiter.establishment_siret)
  await updateSirets(lbaSirets, EntrepriseEngagementHandicapOrigin.LA_BONNE_ALTERNANCE)

  console.info("updating engagement FT")
  const engagementsHandicap = await getDbCollection(referentielEngagementEntrepriseModel.collectionName)
    .find({
      sources: { $in: ["france-travail"] },
      engagement: "handicap",
    })
    .toArray()
  const ftSirets = engagementsHandicap.map((x) => x.siret)
  await updateSirets(ftSirets, EntrepriseEngagementHandicapOrigin.FRANCE_TRAVAIL)

  console.info("fin de 20250910000000-engagement-handicap-entreprises-lba.ts")
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false

async function updateSirets(sirets: string[], value: EntrepriseEngagementHandicapOrigin) {
  sirets = [...new Set(sirets)]
  if (sirets.length) {
    const operations = sirets.map((siret) => ({
      updateOne: {
        filter: { siret },
        update: { $set: { engagementHandicapOrigin: value } },
      },
    }))
    const result = await getDbCollection(entrepriseModel.collectionName).bulkWrite(operations, { ordered: false })
    console.info(`entreprises modifiées : ${result.modifiedCount}`)
  } else {
    console.info(`0 sirets`)
  }
}
