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
      res.status(200).send(await findElligibleTrainingForAppointmentV2(req.body))
    }
  )
}
