import Boom from "boom"
import { zRoutes } from "shared/index"

import { EligibleTrainingsForAppointment } from "../../../common/model/index"
import { getDbCollection } from "../../../common/utils/mongodbUtils"
import * as eligibleTrainingsForAppointmentService from "../../../services/eligibleTrainingsForAppointment.service"
import { Server } from "../../server"

/**
 * Sample entity route module for GET
 */
export default (server: Server) => {
  /**
   * Get all eligibleTrainingsForAppointments GET
   * */
  server.get(
    "/admin/eligible-trainings-for-appointment/etablissement-formateur-siret/:siret",
    {
      schema: zRoutes.get["/admin/eligible-trainings-for-appointment/etablissement-formateur-siret/:siret"],
      onRequest: [server.auth(zRoutes.get["/admin/eligible-trainings-for-appointment/etablissement-formateur-siret/:siret"])],
    },
    async (req, res) => {
      const { siret } = req.params

      const parameters = await EligibleTrainingsForAppointment.find({ etablissement_formateur_siret: siret }).lean()

      if (parameters == undefined || parameters.length == 0) {
        throw Boom.badRequest()
      }

      return res.send({ parameters })
    }
  )

  /**
   * Patch parameter.
   */
  server.patch(
    "/admin/eligible-trainings-for-appointment/:id",
    {
      schema: zRoutes.patch["/admin/eligible-trainings-for-appointment/:id"],
      onRequest: [server.auth(zRoutes.patch["/admin/eligible-trainings-for-appointment/:id"])],
    },
    async ({ body, params }, res) => {
      console.log(body)
      if ("is_lieu_formation_email_customized" in body) {
        if (body.is_lieu_formation_email_customized) {
          if ("cle_ministere_educatif" in body && "lieu_formation_email" in body && body.lieu_formation_email && body.cle_ministere_educatif) {
            await getDbCollection("customemailetfas").findOneAndUpdate(
              { cle_ministere_educatif: body.cle_ministere_educatif },
              { $set: { email: body.lieu_formation_email, cle_ministere_educatif: body.cle_ministere_educatif } },
              { upsert: true }
            )
          }
        }
      }
      const result = await eligibleTrainingsForAppointmentService.updateParameter(params.id.toString(), body).lean()

      res.send(result)
    }
  )
}
