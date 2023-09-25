import { ObjectId } from "mongodb"
import { FilterQuery } from "mongoose"
import { IAppointment } from "shared/models"

import { Appointment } from "../common/model/index"
import { IAppointments } from "../common/model/schema/appointments/appointments.types"

/**
 * @description Create a new appointment.
 * @param {Partial<IAppointments>} params - Appointment params.
 * @returns {Promise<IAppointments>}
 */
const createAppointment = async (params: Partial<IAppointments>) => {
  const appointment = new Appointment(params)
  await appointment.save()

  return appointment.toObject()
}

/**
 * @description Find by id.
 * @param {string} id - Appointment id.
 * @returns {Promise<IAppointments>}
 */
const findById = async (id: ObjectId): Promise<IAppointment | null> => Appointment.findById(id)

/**
 * @description Find items.
 * @param {FilterQuery<IAppointments>} conditions - Query conditions.
 * @returns {Promise<IAppointments[]>}
 */
const find = (conditions: FilterQuery<IAppointments>) => Appointment.find(conditions)

/**
 * @description Find one.
 * @param {FilterQuery<IAppointments>} conditions - Query conditions.
 * @returns {Promise<IAppointments>}
 */
const findOne = (conditions: FilterQuery<IAppointments>) => Appointment.findOne(conditions)

/**
 * @description Find on and update it.
 * @param {FilterQuery<IAppointments>} conditions - Query conditions.
 * @param {Partial<IAppointments>} values - Appointment params.
 * @returns {Promise<IAppointments>}
 */
const findOneAndUpdate = (conditions: FilterQuery<IAppointments>, values) => Appointment.findOneAndUpdate(conditions, values, { new: true })

/**
 * @description Update many items.
 * @param {FilterQuery<IAppointments>} conditions - Query conditions.
 * @param {Partial<IAppointments>} values - Appointment params.
 * @returns {Promise<IAppointments>}
 */
const updateMany = (conditions: FilterQuery<IAppointments>, values) => Appointment.updateMany(conditions, values)

/**
 * @description Update one.
 * @param {string} id - Appointment id.
 * @param {Partial<IAppointments>} values - Appointment params.
 * @returns {Promise<IAppointments>}
 */
const updateAppointment = (id: string, values) => Appointment.findOneAndUpdate({ _id: id }, values, { new: true })

export { createAppointment, findById, find, findOne, findOneAndUpdate, updateMany, updateAppointment }
