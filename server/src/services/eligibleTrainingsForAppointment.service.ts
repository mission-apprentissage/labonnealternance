import type { ObjectId } from "mongodb"
import type { FilterQuery } from "mongoose"
import { IEligibleTrainingsForAppointment, IFormationCatalogue } from "shared"

import { EligibleTrainingsForAppointment } from "../common/model/index"
import { isValidEmail } from "../common/utils/isValidEmail"

import { isEmailBlacklisted } from "./application.service"
import { getMostFrequentEmailByGestionnaireSiret } from "./formation.service"

const create = (params: Partial<IEligibleTrainingsForAppointment>) => EligibleTrainingsForAppointment.create(params)

const find = (conditions: FilterQuery<IEligibleTrainingsForAppointment>, options = {}) => EligibleTrainingsForAppointment.find(conditions, options)

const findOne = (conditions: FilterQuery<IEligibleTrainingsForAppointment>) => EligibleTrainingsForAppointment.findOne(conditions)

const updateParameter = (id: ObjectId | string, params: Partial<IEligibleTrainingsForAppointment>) =>
  EligibleTrainingsForAppointment.findOneAndUpdate({ _id: id }, params, { new: true })

const remove = (id: string) => EligibleTrainingsForAppointment.findByIdAndDelete(id)

const updateMany = (conditions: FilterQuery<IEligibleTrainingsForAppointment>, values) =>
  EligibleTrainingsForAppointment.updateMany(conditions, values, { new: true, upsert: true })

const update = (conditions: FilterQuery<IEligibleTrainingsForAppointment>, values) => EligibleTrainingsForAppointment.updateMany(conditions, values, { new: true })

const getParameterByCleMinistereEducatif = ({ cleMinistereEducatif }) => EligibleTrainingsForAppointment.findOne({ cle_ministere_educatif: cleMinistereEducatif }).lean()

const getEmailForRdv = async (
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

export { create, find, findOne, getEmailForRdv, getParameterByCleMinistereEducatif, remove, update, updateMany, updateParameter }
