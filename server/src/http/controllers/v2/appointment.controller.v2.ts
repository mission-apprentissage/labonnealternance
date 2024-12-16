import { zRoutes } from "shared/index"
import { IAppointmentContextCleMinistereEducatif, IAppointmentContextOnisep, IAppointmentContextParcoursup } from "shared/routes/appointments.routes.v2"

import { findElligibleTrainingForAppointmentV2 } from "../../../services/eligibleTrainingsForAppointment.service"
import { Server } from "../../server"

export default (server: Server) => {
  // TODO: évaluation passage en GET avant communication utilisateurs finaux
  server.post(
    "/appointment",
    {
      schema: zRoutes.post["/appointment"],
      onRequest: server.auth(zRoutes.post["/appointment"]),
    },
    async (req, res) => {
      const body = req.body as IAppointmentContextCleMinistereEducatif | IAppointmentContextOnisep | IAppointmentContextParcoursup
      res.status(200).send(await findElligibleTrainingForAppointmentV2(body))
    }
  )
}
