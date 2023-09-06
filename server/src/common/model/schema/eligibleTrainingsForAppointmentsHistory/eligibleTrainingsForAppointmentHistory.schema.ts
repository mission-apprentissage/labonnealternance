import { model } from "../../../mongodb"
import { eligibleTrainingsForAppointmentSchema } from "../eligibleTrainingsForAppointment/eligibleTrainingsForAppointment.schema"
import { IEligibleTrainingsForAppointment } from "../eligibleTrainingsForAppointment/eligibleTrainingsForAppointment.types"

export default model<IEligibleTrainingsForAppointment>("eligible_trainings_for_appointments_history", eligibleTrainingsForAppointmentSchema)
