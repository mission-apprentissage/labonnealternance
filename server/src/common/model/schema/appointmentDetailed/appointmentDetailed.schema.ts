import { model } from "../../../mongodb.js"
import { appointmentSchema } from "../appointments/appointment.schema.js"
import { IAppointments } from "../appointments/appointments.types.js"

export default model<IAppointments>("appointmentDetailed", appointmentSchema)
