import { EligibleTrainingsForAppointment } from "../common/model/index.js"
import { IEligibleTrainingsForAppointment } from "../common/model/schema/eligibleTrainingsForAppointment/eligibleTrainingsForAppointment.types.js"
import { FilterQuery } from "mongoose"

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
const updateParameter = (id: string, params: Partial<IEligibleTrainingsForAppointment>) => EligibleTrainingsForAppointment.findOneAndUpdate({ _id: id }, params, { new: true })

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

export { create, find, findOne, updateParameter, remove, updateMany, update, getParameterByCleMinistereEducatif }
