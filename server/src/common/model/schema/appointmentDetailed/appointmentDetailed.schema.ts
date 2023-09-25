import { IAppointments } from "shared"

import { model } from "../../../mongodb"
import { appointmentSchema } from "../appointments/appointment.schema"

export default model<IAppointments>("appointmentDetailed", appointmentSchema)
