import { unauthorized } from "@hapi/boom"
import type { ReferrerApiEnum } from "shared/constants/referers"
import { isValidReferrerApi } from "shared/constants/referers"
import { zRoutes } from "shared/index"
import type { Server } from "@/http/server"
import { getUserFromRequest } from "@/security/authenticationService"
import { findElligibleTrainingForAppointmentV2 } from "@/services/eligibleTrainingsForAppointment.service"

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
      const referrer = user.organisation as ReferrerApiEnum
      if (!referrer) {
        throw unauthorized("Organisation not found")
      }
      if (!isValidReferrerApi(referrer)) {
        throw unauthorized("Invalid organisation")
      }
      res.status(200).send(await findElligibleTrainingForAppointmentV2({ ...req.body, referrer }))
    }
  )
}
