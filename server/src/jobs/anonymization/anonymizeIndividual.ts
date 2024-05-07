import { logger } from "../../common/logger"
import { AnonymizedUser, Application, Recruiter, User, User2 } from "../../common/model/index"

const anonimizeUser2 = (_id: string) =>
  User2.aggregate([
    {
      $match: { _id },
    },
    {
      $project: {
        last_action_date: 1,
        origin: 1,
        status: 1,
      },
    },
    {
      // @ts-ignore
      $merge: "anonymizeduser2s",
    },
  ])

const anonimizeRecruiterByUserId = (userId: string) =>
  Recruiter.aggregate([
    {
      $match: { "jobs.managed_by": userId },
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
      // @ts-ignore
      $merge: "anonymizedrecruiteurs",
    },
  ])

const deleteRecruiter = (query) => Recruiter.deleteMany(query)
const deleteUser2 = (query) => User2.deleteMany(query)

const anonymizeApplication = async (_id: string) => {
  await Application.aggregate([
    {
      $match: { _id },
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
      // @ts-ignore
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

const anonymizeUser2AndRecruiter = async (userId: string) => {
  const user = await User2.findById(userId)
  if (!user) {
    throw new Error("Anonymize user not found")
  }
  await Promise.all([anonimizeUser2(userId), anonimizeRecruiterByUserId(userId)])
  await Promise.all([deleteUser2({ _id: userId }), deleteRecruiter({ "jobs.managed_by": userId })])
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
      await anonymizeUser2AndRecruiter(id)
      break
    }
    default:
      break
  }
}
export default anonymizeIndividual
