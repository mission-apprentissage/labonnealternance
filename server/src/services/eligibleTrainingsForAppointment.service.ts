import { ObjectId } from "mongodb"
import { FilterQuery } from "mongoose"
import { IFormationCatalogue, IEligibleTrainingsForAppointment } from "shared"

import { EligibleTrainingsForAppointment } from "../common/model/index"

import { getEmailFromCatalogueField } from "./catalogue.service"
import { getMostFrequentEmailByLieuFormationSiret } from "./formation.service"

/**
 * @description Creates new item.
 * @Param {Partial<IEligibleTrainingsForAppointment>} params - EligibleTrainingsForAppointment params
 * @returns {Promise<IEligibleTrainingsForAppointment>}
 */
const create = (params: Partial<IEligibleTrainingsForAppointment>) => EligibleTrainingsForAppointment.create(params)

/**
 * @description Finds items.
 * @param {FilterQuery<IEligibleTrainingsForAppointment>} conditions - Where conditions
 * @param {Object} options - Query options
 * @returns {Promise<IEligibleTrainingsForAppointment[]>}
 */
const find = (conditions, options = {}) => EligibleTrainingsForAppointment.find(conditions, options)

/**
 * @description Returns one item.
 * @param {FilterQuery<IEligibleTrainingsForAppointment>} conditions - Where conditions
 * @returns {Promise<IEligibleTrainingsForAppointment>}
 */
const findOne = (conditions: FilterQuery<IEligibleTrainingsForAppointment>) => EligibleTrainingsForAppointment.findOne(conditions)

/**
 * @description Updates item.
 * @param {String} id
 * @param {Partial<IEligibleTrainingsForAppointment>} params - EligibleTrainingsForAppointment params
 * @returns {Promise<IEligibleTrainingsForAppointment>}
 */
const updateParameter = (id: ObjectId | string, params: Partial<IEligibleTrainingsForAppointment>) =>
  EligibleTrainingsForAppointment.findOneAndUpdate({ _id: id }, params, { new: true })

/**
 * @description Deletes an item.
 * @param {String} id
 * @returns {Promise<void>}
 */
const remove = (id: string) => EligibleTrainingsForAppointment.findByIdAndDelete(id)

/**
 * @description Update many documents (or upsert).
 * @param {FilterQuery<IEligibleTrainingsForAppointment>} conditions - Where conditions
 * @param {Object} values - Values to update
 * @returns {Promise<IEligibleTrainingsForAppointment>}
 */
const updateMany = (conditions: FilterQuery<IEligibleTrainingsForAppointment>, values) =>
  EligibleTrainingsForAppointment.updateMany(conditions, values, { new: true, upsert: true })

/**
 * @description Update many documents.
 * @param {FilterQuery<IEligibleTrainingsForAppointment>} conditions - Where conditions
 * @param {Object} values - Values to update
 * @returns {Promise<IEligibleTrainingsForAppointment>}
 */
const update = (conditions: FilterQuery<IEligibleTrainingsForAppointment>, values) => EligibleTrainingsForAppointment.updateMany(conditions, values, { new: true })

/**
 * @description Returns item from its "cle_ministere_educatif".
 * @param {String} cleMinistereEducatif
 * @returns {Promise<IEligibleTrainingsForAppointment>}
 */
const getParameterByCleMinistereEducatif = ({ cleMinistereEducatif }) => EligibleTrainingsForAppointment.findOne({ cle_ministere_educatif: cleMinistereEducatif }).lean()

/**
 * Returns email for rdv:
 * 1. Returns "email" if it's valid
 * 2. Or returns "etablissement_formateur_courriel" if it's valid
 * 3. Or returns the most frequent email from "etablissement_formateur_siret"
 * 4. Or returns null (no email found)
 * @param {Pick<IFormationCatalogue, "email" | "etablissement_formateur_courriel" | "etablissement_formateur_siret">} formation
 * @returns {Promise<string | null>}
 */
const getEmailForRdv = async (formation: Pick<IFormationCatalogue, "email" | "etablissement_formateur_courriel" | "etablissement_formateur_siret">): Promise<string | null> => {
  return (
    getEmailFromCatalogueField(formation.email) ||
    getEmailFromCatalogueField(formation.etablissement_formateur_courriel) ||
    (await getMostFrequentEmailByLieuFormationSiret(formation.etablissement_formateur_siret))
  )
}

export { create, find, findOne, updateParameter, remove, updateMany, update, getParameterByCleMinistereEducatif, getEmailForRdv }
