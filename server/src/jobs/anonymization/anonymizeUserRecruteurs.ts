import dayjs from "dayjs"

import { logger } from "../../common/logger"
import { Recruiter, UserRecruteur } from "../../common/model/index"
import { notifyToSlack } from "../../common/utils/slackUtils"

const anonymize = async () => {
  const fromDate = dayjs().subtract(2, "years").toDate()
  const userRecruteurQuery = { $or: [{ last_connection: { $lte: fromDate } }, { last_connection: null, createdAt: { $lte: fromDate } }] }
  const usersToAnonymize = await UserRecruteur.find(userRecruteurQuery).lean()
  const establishmentIds = usersToAnonymize.flatMap(({ establishment_id }) => (establishment_id ? [establishment_id] : []))
  const recruiterQuery = { establishment_id: { $in: establishmentIds } }
  await UserRecruteur.aggregate([
    {
      $match: userRecruteurQuery,
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
  await Recruiter.aggregate([
    {
      $match: recruiterQuery,
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
  const { deletedCount: recruiterCount } = await Recruiter.deleteMany(recruiterQuery)
  const { deletedCount: userRecruteurCount } = await UserRecruteur.deleteMany(userRecruteurQuery)
  return { userRecruteurCount, recruiterCount }
}

export async function anonimizeUserRecruteurs() {
  const subject = "ANONYMISATION DES USER RECRUTEURS et RECRUITERS"
  try {
    logger.info(" -- Anonymisation des user recruteurs de plus de 2 ans -- ")

    const { recruiterCount, userRecruteurCount } = await anonymize()

    await notifyToSlack({
      subject,
      message: `Anonymisation des user recruteurs de plus de 2 ans terminée. ${userRecruteurCount} user recruteur(s) anonymisé(s). ${recruiterCount} recruiter(s) anonymisé(s)`,
      error: false,
    })
  } catch (err: any) {
    await notifyToSlack({ subject, message: `ECHEC anonymisation des user recruteurs`, error: true })
    throw err
  }
}
