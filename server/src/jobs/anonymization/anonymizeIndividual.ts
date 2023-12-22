import { ObjectId } from "mongodb"
import { CFA, ENTREPRISE } from "shared/constants/recruteur"

import { logger } from "../../common/logger"
import { AnonymizedUser, Application, Recruiter, User, UserRecruteur } from "../../common/model/index"

const anonimizeUserRecruteur = (_id: string) =>
  UserRecruteur.aggregate([
    {
      $match: { _id },
    },
    {
      $project: {
        opco: 1,
        idcc: 1,
        establishment_raison_sociale: 1,
        establishment_enseigne: 1,
        establishment_siret: 1,
        address_detail: 1,
        address: 1,
        geo_coordinates: 1,
        scope: 1,
        is_email_checked: 1,
        type: 1,
        establishment_id: 1,
        last_connection: 1,
        origin: 1,
        status: 1,
        is_qualiopi: 1,
      },
    },
    {
      $merge: "anonymizeduserrecruteurs",
    },
  ])
const anonimizeRecruiter = (query: object) =>
  Recruiter.aggregate([
    {
      $match: query,
    },
    {
      $project: {
        establishment_id: 1,
        establishment_raison_sociale: 1,
        establishment_enseigne: 1,
        establishment_siret: 1,
        address_detail: 1,
        address: 1,
        geo_coordinates: 1,
        is_delegated: 1,
        cfa_delegated_siret: 1,
        jobs: 1,
        origin: 1,
        opco: 1,
        idcc: 1,
        status: 1,
        naf_code: 1,
        naf_label: 1,
        establishment_size: 1,
        establishment_creation_date: 1,
      },
    },
    {
      $merge: "anonymizedrecruiteurs",
    },
  ])

const deleteRecruiter = (query) => Recruiter.deleteMany(query)
const deleteUserRecruteur = (query) => UserRecruteur.deleteMany(query)

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

  logger.info(`Anonymized application ${_id}`)
}

const anonymizeUser = async (_id: string) => {
  const user = await User.findOne({ _id }).lean()

  if (user) {
    await AnonymizedUser.create({
      userId: user._id,
      type: user.type,
      role: user.role,
      last_action_date: user.last_action_date,
    })
    await User.deleteOne({ _id })

    logger.info(`Anonymized user ${_id}`)
  } else {
    logger.info(`User not found ${_id}`)
  }
}

const anonymizeUserRecruterAndRecruiter = async (_id: string) => {
  const user = await UserRecruteur.findById(_id).lean()

  if (!user) {
    throw new Error("Anonymize userRecruter not found")
  }

  switch (user.type) {
    case ENTREPRISE:
      await Promise.all([anonimizeUserRecruteur(user._id.toString()), anonimizeRecruiter({ establishment_id: user.establishment_id })])
      await Promise.all([deleteUserRecruteur({ _id: user._id }), deleteRecruiter({ establishment_id: user.establishment_id })])

      break
    case CFA:
      await Promise.all([anonimizeUserRecruteur(user._id.toString()), anonimizeRecruiter({ cfa_delegated_siret: user.establishment_siret })])
      await Promise.all([deleteUserRecruteur({ _id: user._id }), deleteRecruiter({ cfa_delegated_siret: user.establishment_siret })])

      break

    default:
      throw new Error(`Anonymize ${user.type} is not permitted. script must be updated manually to delete this type of user.`)
  }
}

export async function anonymizeIndividual({ collection, id }: { collection: string; id: string }): Promise<void> {
  switch (collection) {
    case "applications": {
      await anonymizeApplication(id)
      break
    }
    case "users": {
      await anonymizeUser(id)
      break
    }
    case "userrecruteurs": {
      await anonymizeUserRecruterAndRecruiter(id)
      break
    }
    default:
      break
  }
}
export default anonymizeIndividual
