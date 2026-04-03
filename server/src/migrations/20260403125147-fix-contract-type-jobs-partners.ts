import { TRAINING_CONTRACT_TYPE } from "shared/constants/recruteur"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("jobs_partners").updateMany({ contract_type: [], partner_label: "La Poste" }, { $set: { contract_type: [TRAINING_CONTRACT_TYPE.APPRENTISSAGE] } })
  await getDbCollection("jobs_partners").updateMany(
    { contract_type: [], partner_label: { $in: ["offres_emploi_lba", "Kelio", "Le bon coin emploi"] } },
    { $set: { contract_type: [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION] } }
  )
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
