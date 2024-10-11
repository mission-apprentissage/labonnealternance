import { zRoutes } from "shared/index"

import { findElligibleTrainingForAppointmentV2 } from "../../../services/eligibleTrainingsForAppointment.service"
import { Server } from "../../server"

export default (server: Server) => {
  server.post(
    "/appointment",
    {
      schema: zRoutes.post["/appointment"],
      onRequest: server.auth(zRoutes.post["/appointment"]),
    },
    async (req, res) => {
      const appointment = await findElligibleTrainingForAppointmentV2(req.body)
      if (!appointment) {
        return res.status(204).send("Appointment request not available")
      }
      return res.send(appointment)
    }
  )
}
