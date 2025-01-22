import { IModelDescriptor } from "./common"
import { ZEligibleTrainingsForAppointmentSchema } from "./elligibleTraining.model"

const collectionName = "eligible_trainings_for_appointments_histories" as const

export default {
  zod: ZEligibleTrainingsForAppointmentSchema,
  indexes: [],
  collectionName,
} as const satisfies IModelDescriptor
