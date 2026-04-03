import { JOBPARTNERS_LABEL } from "shared/constants/jobPartners"
import { TRAINING_CONTRACT_TYPE } from "shared/constants/recruteur"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("jobs_partners").updateMany(
    { contract_type: [], partner_label: JOBPARTNERS_LABEL.LA_POSTE },
    { $set: { contract_type: [TRAINING_CONTRACT_TYPE.APPRENTISSAGE] } }
  )
  await getDbCollection("jobs_partners").updateMany(
    {
      contract_type: [],
      partner_label: {
        $in: [JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, JOBPARTNERS_LABEL.KELIO, JOBPARTNERS_LABEL.LE_BON_COIN_EMPLOI],
      },
    },
    { $set: { contract_type: [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION] } }
  )
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
