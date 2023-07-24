import { model } from "../../../mongodb.js"
import { eligibleTrainingsForAppointmentSchema } from "../eligibleTrainingsForAppointment/eligibleTrainingsForAppointment.schema.js"
import { IEligibleTrainingsForAppointment } from "../eligibleTrainingsForAppointment/eligibleTrainingsForAppointment.types.js"

export default model<IEligibleTrainingsForAppointment>("eligible_trainings_for_appointments_history", eligibleTrainingsForAppointmentSchema)
