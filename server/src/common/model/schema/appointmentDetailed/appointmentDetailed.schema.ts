import { model } from "../../../mongodb"
import { appointmentSchema } from "../appointments/appointment.schema"
import { IAppointments } from "../appointments/appointments.types"

export default model<IAppointments>("appointmentDetailed", appointmentSchema)
