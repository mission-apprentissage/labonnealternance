import { Appointment } from "../model/index.js"

export default () => ({
  /**
   * @description Crates an appointment.
   * @param {Appointment} params
   * @returns {Promise<Appointment>}
   */
  createAppointment: async (params) => {
    const appointment = new Appointment(params)
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
   * @description Update many documents.
   * @param {Object} conditions
   * @param {Object} values
   * @returns {Promise<Appointment[]>}
   */
  updateMany: (conditions, values) => Appointment.updateMany(conditions, values),

  /**
   * @description Updates an appointment from its id.
   * @param {ObjectId} id
   * @param {Object} values
   * @returns {Appointment}
   */
  updateAppointment: (id, values) => Appointment.findOneAndUpdate({ _id: id }, values, { new: true }),
})
