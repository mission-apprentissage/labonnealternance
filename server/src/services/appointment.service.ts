import { ObjectId } from "mongodb"
import { FilterQuery } from "mongoose"
import { IAppointment } from "shared"

import { Appointment } from "../common/model/index"

const createAppointment = async (params: Partial<IAppointment>) => {
  const appointment = new Appointment(params)
  await appointment.save()

  return appointment.toObject()
}

const findById = async (id: ObjectId | string): Promise<IAppointment | null> => Appointment.findById(id).lean()

const find = (conditions: FilterQuery<IAppointment>) => Appointment.find(conditions)

const findOne = (conditions: FilterQuery<IAppointment>) => Appointment.findOne(conditions)

const findOneAndUpdate = (conditions: FilterQuery<IAppointment>, values) => Appointment.findOneAndUpdate(conditions, values, { new: true })

const updateMany = (conditions: FilterQuery<IAppointment>, values) => Appointment.updateMany(conditions, values)

const updateAppointment = (id: string, values) => Appointment.findOneAndUpdate({ _id: id }, values, { new: true })

export { createAppointment, findById, find, findOne, findOneAndUpdate, updateMany, updateAppointment }
