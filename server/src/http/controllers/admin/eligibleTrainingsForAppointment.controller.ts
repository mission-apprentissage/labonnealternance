import Boom from "boom"
import { zRoutes } from "shared/index"

import { getDbCollection } from "@/common/utils/mongodbUtils"

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

      const parameters = await getDbCollection("eligible_trainings_for_appointments").find({ etablissement_formateur_siret: siret }).toArray()

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
      const result = await getDbCollection("eligible_trainings_for_appointments").findOneAndUpdate({ _id: params.id }, { $set: { ...body } }, { returnDocument: "after" })

      res.send(result)
    }
  )
}
