import { Appointment } from "../model/index.js"

export default () => ({
  /**
   * @description Crates an appointment.
   * @param {String} candidat_id
   * @param {String} formation_id
   * @param {String} etablissement_id
   * @param {String} formation_id
   * @param {String} motivations
   * @param {Number} referrer
   * @param {String} id_rco_formation
   * @param {String} cle_ministere_educatif
   * @returns {Promise<Appointment>}
   */
  createAppointment: async ({ candidat_id, etablissement_id, formation_id, motivations, referrer, id_rco_formation, cle_ministere_educatif }) => {
    const appointment = new Appointment({
      candidat_id,
      motivations,
      etablissement_id,
      formation_id,
      referrer,
      id_rco_formation,
      cle_ministere_educatif,
    })
    await appointment.save()

    return appointment.toObject()
  },

  /**
   * @description Returns an appointment from its id.
   * @param {string} id
   * @returns {Promise<Appointment>}
   */
  findById: (id) => Appointment.findById(id),

  /**
   * @description Returns appoint from its id.
   * @param {ObjectId} id
   * @returns {Promise<*>}
   */
  getAppointmentById: async (id) => {
    const appointment = await Appointment.findById(id)
    if (!appointment) {
      throw new Error(`Unable to find appointement ${id}`)
    }
    return appointment.toObject()
  },

  /**
   * @description Returns items.
   * @param {Object} conditions
   * @returns {Promise<Appointment[]>}
   */
  find: (conditions) => Appointment.find(conditions),

  /**
   * @description Returns one item.
   * @param {Object} conditions
   * @returns {Promise<Appointment>}
   */
  findOne: (conditions) => Appointment.findOne(conditions),

  /**
   * @description Updates an appointment from its conditions.
   * @param {Object} conditions
   * @param {Object} values
   * @returns {Promise<Appointment>}
   */
  findOneAndUpdate: (conditions, values) => Appointment.findOneAndUpdate(conditions, values, { new: true }),

  /**
   * @description Updates opened mail status for candidate.
   * @param {String} id
   * @returns {Promise<*>}
   */
  updateStatusMailOpenedByCandidat: async (id) => {
    const retrievedData = await Appointment.findById(id)

    retrievedData.email_premiere_demande_candidat_ouvert = true

    return Appointment.findOneAndUpdate({ _id: id }, retrievedData, { new: true })
  },

  /**
   * @description Updates opened mail status for the CFA.
   * @param {String} id
   * @returns {Promise<*>}
   */
  updateStatusMailOpenedByCentre: async (id) => {
    const retrievedData = await Appointment.findById(id)

    retrievedData.email_premiere_demande_cfa_ouvert = true

    return Appointment.findOneAndUpdate({ _id: id }, retrievedData, { new: true })
  },

  /**
   * @description Updates an appointment from its id.
   * @param {ObjectId} id
   * @param {Object} values
   * @returns {Appointment}
   */
  updateAppointment: (id, values) => Appointment.findOneAndUpdate({ _id: id }, values, { new: true }),
})
