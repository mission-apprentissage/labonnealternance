import { zRoutes } from "shared/index"

import { findElligibleTrainingForAppointment, getElligibleTrainingAppointmentContext } from "../../services/eligibleTrainingsForAppointment.service"
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

  server.get(
    "/appointment/:cle_ministere_educatif/context",
    {
      schema: zRoutes.get["/appointment/:cle_ministere_educatif/context"],
    },
    async (req, res) => {
      const { cle_ministere_educatif } = req.params
      const { referrer } = req.query
      res.status(200).send(await getElligibleTrainingAppointmentContext(cle_ministere_educatif, referrer))
    }
  )
}
