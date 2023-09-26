import { IAppointment } from "shared"

import { model } from "../../../mongodb"
import { appointmentSchema } from "../appointments/appointment.schema"

export default model<IAppointment>("appointmentDetailed", appointmentSchema)
