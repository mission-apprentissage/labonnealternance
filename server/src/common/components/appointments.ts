import { Appointment } from "../model/index.js"

export default () => ({
  /**
   * @description Crates an appointment.
   * @param {String} applicant_id
   * @param {String} formation_id
   * @param {String} cfa_gestionnaire_siret
   * @param {String} formation_id
   * @param {String} applicant_message_to_cfa
   * @param {Number} referrer
   * @param {String} id_rco_formation
   * @param {String} cle_ministere_educatif
   * @returns {Promise<Appointment>}
   */
  createAppointment: async ({ applicant_id, cfa_gestionnaire_siret, formation_id, applicant_message_to_cfa, referrer, id_rco_formation, cle_ministere_educatif }) => {
    const appointment = new Appointment({
      applicant_id,
      applicant_message_to_cfa,
      cfa_gestionnaire_siret,
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
   * @description Updates an appointment from its id.
   * @param {ObjectId} id
   * @param {Object} values
   * @returns {Appointment}
   */
  updateAppointment: (id, values) => Appointment.findOneAndUpdate({ _id: id }, values, { new: true }),
})
