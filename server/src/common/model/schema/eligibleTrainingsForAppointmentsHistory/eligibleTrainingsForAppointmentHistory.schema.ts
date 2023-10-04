import { IEligibleTrainingsForAppointment } from "shared"

import { model } from "../../../mongodb"
import { eligibleTrainingsForAppointmentSchema } from "../eligibleTrainingsForAppointment/eligibleTrainingsForAppointment.schema"

export default model<IEligibleTrainingsForAppointment>("eligible_trainings_for_appointments_history", eligibleTrainingsForAppointmentSchema)
