import { unauthorized } from "@hapi/boom"
import { ReferrerEnum } from "shared/constants/referers"
import { zRoutes } from "shared/index"

import { getUserFromRequest } from "../../../security/authenticationService"
import { findElligibleTrainingForAppointmentV2 } from "../../../services/eligibleTrainingsForAppointment.service"
import { Server } from "../../server"

export default (server: Server) => {
  // TODO: évaluation passage en GET avant communication utilisateurs finaux
  server.post(
    "/v2/appointment",
    {
      schema: zRoutes.post["/v2/appointment"],
      onRequest: server.auth(zRoutes.post["/v2/appointment"]),
    },
    async (req, res) => {
      const user = getUserFromRequest(req, zRoutes.post["/v2/appointment"]).value
      const referrer = user.organisation as ReferrerEnum
      if (!referrer) {
        throw unauthorized("Organisation not found")
      }
      res.status(200).send(await findElligibleTrainingForAppointmentV2({ ...req.body, referrer }))
    }
  )
}
