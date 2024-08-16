import { IModelDescriptor } from "./common"
import { ZEligibleTrainingsForAppointmentSchema } from "./elligibleTraining.model"

const collectionName = "eligible_trainings_for_appointments_histories" as const

export default {
  zod: ZEligibleTrainingsForAppointmentSchema,
  indexes: [
    [{ affelnet_visible: 1 }, {}],
    [{ cle_ministere_educatif: 1 }, {}],
    [{ parcoursup_id: 1 }, {}],
    [{ parcoursup_visible: 1 }, {}],
    [{ rco_formation_id: 1 }, {}],
    [{ referrers: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
