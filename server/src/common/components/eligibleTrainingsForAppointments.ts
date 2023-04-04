import { EligibleTrainingsForAppointment } from "../model/index.js"

export default () => ({
  /**
   * @description Creates new item.
   * @returns {Promise<*>}
   */
  create: async (body) => await EligibleTrainingsForAppointment.create(body),

  /**
   * @description Returns items.
   * @param {Object} conditions
   * @param {Object} options
   * @returns {Promise<EligibleTrainingsForAppointment[]>}
   */
  find: (conditions, options = {}) => EligibleTrainingsForAppointment.find(conditions, options),

  /**
   * @description Returns one item.
   * @param {Object} conditions
   * @returns {Promise<EligibleTrainingsForAppointment>}
   */
  findOne: (conditions) => EligibleTrainingsForAppointment.findOne(conditions),

  /**
   * @description Updates item.
   * @param {String} id
   * @param {EligibleTrainingsForAppointment} body
   * @returns {Promise<*>}
   */
  updateParameter: (id, body) => EligibleTrainingsForAppointment.findOneAndUpdate({ _id: id }, body, { new: true }),

  /**
   * @description Deletes an item.
   * @param {String} id
   * @returns {Promise<*>}
   */
  remove: (id) => EligibleTrainingsForAppointment.findByIdAndDelete(id),

  /**
   * @description Update many documents (or upsert).
   * @param {Object} conditions
   * @param {Object} values
   * @returns {Promise<EligibleTrainingsForAppointment>}
   */
  updateMany: (conditions, values) => EligibleTrainingsForAppointment.updateMany(conditions, values, { new: true, upsert: true }),

  /**
   * @description Update many documents.
   * @param {Object} conditions
   * @param {Object} values
   * @returns {Promise<EligibleTrainingsForAppointment>}
   */
  update: (conditions, values) => EligibleTrainingsForAppointment.updateMany(conditions, values, { new: true }),

  /**
   * @description Returns item from its "cle_ministere_educatif".
   * @param {String} cleMinistereEducatif
   * @returns {Promise<EligibleTrainingsForAppointment>}
   */
  getParameterByCleMinistereEducatif: ({ cleMinistereEducatif }) => EligibleTrainingsForAppointment.findOne({ cle_ministere_educatif: cleMinistereEducatif }).lean(),
})
