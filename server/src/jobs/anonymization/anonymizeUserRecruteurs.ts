import dayjs from "dayjs"

import { logger } from "../../common/logger"
import { Recruiter, UserRecruteur } from "../../common/model/index"
import { notifyToSlack } from "../../common/utils/slackUtils"

const anonymize = async () => {
  const fromDate = dayjs().subtract(2, "years").toDate()
  const usersToAnonymize = await UserRecruteur.find({ last_connection: { $lte: fromDate } }).lean()
  const establishmentIds = usersToAnonymize.flatMap(({ establishment_id }) => (establishment_id ? [establishment_id] : []))
  await UserRecruteur.aggregate([
    {
      $match: { last_connection: { $lte: fromDate } },
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
      $merge: "anonymizedUserRecruteurs",
    },
  ])
  await Recruiter.aggregate([
    {
      $match: { establishment_id: { $in: establishmentIds } },
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
  const { deletedCount: recruiterCount } = await Recruiter.deleteMany({ establishment_id: { $in: establishmentIds } })
  const { deletedCount: userRecruteurCount } = await UserRecruteur.deleteMany({ last_connection: { $lte: fromDate } })
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
