import { forbidden } from "@hapi/boom"
import type { ReferrerApiEnum } from "shared/constants/referers"
import { isValidReferrerApi } from "shared/constants/referers"
import { zRoutes } from "shared/index"
import { APPOINTMENT_LINKS_REFERRERS } from "shared/routes/v2/appointments.routes.v2"
import type { Server } from "@/http/server"
import { getUserFromRequest } from "@/security/authentication.service"
import { findElligibleTrainingForAppointmentV2, getAppointmentLinks } from "@/services/eligible-trainings-for-appointment.service"

const isAppointmentLinksReferrer = (referrer: ReferrerApiEnum): referrer is (typeof APPOINTMENT_LINKS_REFERRERS)[number] =>
  (APPOINTMENT_LINKS_REFERRERS as readonly ReferrerApiEnum[]).includes(referrer)

// Refus d'organisation en 403, jamais en 401 : api-apprentissage traite toute 401 de LBA comme une
// clé de relais invalide et répond 500 au consommateur (forwardApi.getResponse).
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
      if (!referrer || !isValidReferrerApi(referrer)) {
        throw forbidden("Organisation not allowed")
      }
      res.status(200).send(await findElligibleTrainingForAppointmentV2({ ...req.body, referrer }))
    }
  )

  server.get(
    "/v2/appointment/links",
    {
      schema: zRoutes.get["/v2/appointment/links"],
      onRequest: server.auth(zRoutes.get["/v2/appointment/links"]),
      // Rate-limit posé côté api-apprentissage par consommateur (issue #4806)
    },
    async (req, res) => {
      const referrer = getUserFromRequest(req, zRoutes.get["/v2/appointment/links"]).value.organisation as ReferrerApiEnum
      if (!referrer || !isValidReferrerApi(referrer) || !isAppointmentLinksReferrer(referrer)) {
        throw forbidden("Organisation not allowed")
      }
      res.status(200).send({ data: await getAppointmentLinks(referrer) })
    }
  )
}
