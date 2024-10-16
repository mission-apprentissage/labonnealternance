import { zRoutes } from "shared/index"

import { findElligibleTrainingForAppointment } from "../../services/eligibleTrainingsForAppointment.service"
import { Server } from "../server"

export default (server: Server) => {
  server.post(
    "/appointment",
    {
      schema: zRoutes.post["/appointment"],
      onRequest: server.auth(zRoutes.post["/appointment"]),
    },
    async (req, res) => {
      res.status(200).send(await findElligibleTrainingForAppointment(req))
    }
  )
}
