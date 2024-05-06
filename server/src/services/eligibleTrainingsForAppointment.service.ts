import Boom from "boom"
import type { ObjectId } from "mongodb"
import type { FilterQuery } from "mongoose"
import { IEligibleTrainingsForAppointment, IFormationCatalogue } from "shared"

import { logger } from "@/common/logger"

import { EligibleTrainingsForAppointment, Etablissement, ReferentielOnisep } from "../common/model/index"
import { isValidEmail } from "../common/utils/isValidEmail"

import { isEmailBlacklisted } from "./application.service"
import { getMostFrequentEmailByGestionnaireSiret } from "./formation.service"

export const create = (params: Partial<IEligibleTrainingsForAppointment>) => EligibleTrainingsForAppointment.create(params)

export const find = (conditions: FilterQuery<IEligibleTrainingsForAppointment>, options = {}) => EligibleTrainingsForAppointment.find(conditions, options)

export const findOne = (conditions: FilterQuery<IEligibleTrainingsForAppointment>) => EligibleTrainingsForAppointment.findOne(conditions)

export const updateParameter = (id: ObjectId | string, params: Partial<IEligibleTrainingsForAppointment>) =>
  EligibleTrainingsForAppointment.findOneAndUpdate({ _id: id }, params, { new: true })

export const remove = (id: string) => EligibleTrainingsForAppointment.findByIdAndDelete(id)

export const updateMany = (conditions: FilterQuery<IEligibleTrainingsForAppointment>, values) =>
  EligibleTrainingsForAppointment.updateMany(conditions, values, { new: true, upsert: true })

export const update = (conditions: FilterQuery<IEligibleTrainingsForAppointment>, values) => EligibleTrainingsForAppointment.updateMany(conditions, values, { new: true })

export const getParameterByCleMinistereEducatif = ({ cleMinistereEducatif }) => EligibleTrainingsForAppointment.findOne({ cle_ministere_educatif: cleMinistereEducatif }).lean()

export const getEmailForRdv = async (
  formation: Pick<IFormationCatalogue, "email" | "etablissement_gestionnaire_courriel" | "etablissement_gestionnaire_siret">,
  type: "email" | "etablissement_gestionnaire_courriel" = "email"
): Promise<string | null> => {
  const { email, etablissement_gestionnaire_courriel, etablissement_gestionnaire_siret } = formation
  if (email && isValidEmail(email) && !(await isEmailBlacklisted(email))) return email
  if (etablissement_gestionnaire_courriel && isValidEmail(etablissement_gestionnaire_courriel) && !(await isEmailBlacklisted(etablissement_gestionnaire_courriel))) {
    return etablissement_gestionnaire_courriel
  } else {
    return await getMostFrequentEmailByGestionnaireSiret(etablissement_gestionnaire_siret ?? undefined, type)
  }
}

export const disableEligibleTraininForAppointmentWithEmail = async (disabledEmail: string) => {
  const eligibleTrainingsForAppointmentsWithEmail = await find({ lieu_formation_email: disabledEmail })

  await Promise.all(
    eligibleTrainingsForAppointmentsWithEmail.map(async (eligibleTrainingsForAppointment) => {
      await eligibleTrainingsForAppointment.updateOne({ _id: eligibleTrainingsForAppointment._id }, { referrers: [], lieu_formation_email: "" })

      logger.info('Eligible training disabled for "hard_bounce" reason', {
        eligibleTrainingsForAppointmentId: eligibleTrainingsForAppointment._id,
        lieu_formation_email: disabledEmail,
      })
    })
  )
}

export const findEligibleTrainingByMinisterialKey = async (idCleMinistereEducatif: string) => {
  return await EligibleTrainingsForAppointment.findOne({ cle_ministere_educatif: idCleMinistereEducatif })
}

export const findEligibleTrainingByParcoursupId = async (idParcoursup: string) => {
  return await EligibleTrainingsForAppointment.findOne({ parcoursup_id: idParcoursup })
}

export const findEligibleTrainingByActionFormation = async (idActionFormation: string) => {
  const referentielOnisepIdActionFormation = await ReferentielOnisep.findOne({ id_action_ideo2: idActionFormation })

  if (!referentielOnisepIdActionFormation) {
    throw Boom.notFound("Formation not found")
  }

  return await EligibleTrainingsForAppointment.findOne({
    cle_ministere_educatif: referentielOnisepIdActionFormation.cle_ministere_educatif,
  })
}

export const findOpenAppointments = async (eligibleTrainingsForAppointment: IEligibleTrainingsForAppointment, referrerName: string) => {
  const isOpenForAppointments = await EligibleTrainingsForAppointment.findOne({
    cle_ministere_educatif: eligibleTrainingsForAppointment.cle_ministere_educatif,
    referrers: { $in: [referrerName] },
    lieu_formation_email: { $nin: [null, ""] },
  })

  return isOpenForAppointments && isValidEmail(isOpenForAppointments?.lieu_formation_email)
}

export const findEtablissement = async (formateurSiret: string | null | undefined) => {
  return await Etablissement.findOne({ formateur_siret: formateurSiret })
}
