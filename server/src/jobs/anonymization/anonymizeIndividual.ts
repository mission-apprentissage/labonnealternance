import { ObjectId } from "mongodb"

import { logger } from "../../common/logger"
import { Application } from "../../common/model/index"

const anonymizeApplication = async (_id: string) => {
  await Application.aggregate([
    {
      $match: { _id: new ObjectId(_id) },
    },
    {
      $project: {
        company_recruitment_intention: 1,
        company_feedback_date: 1,
        company_siret: 1,
        company_naf: 1,
        job_origin: 1,
        job_id: 1,
        caller: 1,
        created_at: 1,
      },
    },
    {
      $merge: "anonymizedapplications",
    },
  ])

  await Application.deleteOne({ _id })

  logger.info(`Anonymized application with ${_id}`)
}

export async function anonymizeIndividual(payload: { collection: string; id: string }): Promise<void> {
  const { collection, id } = payload

  switch (collection) {
    case "applications": {
      await anonymizeApplication(id)
      break
    }
    case "recruiters": {
      break
    }
    case "userRecruteurs": {
      break
    }
    default:
      break
  }
}
export default anonymizeIndividual
