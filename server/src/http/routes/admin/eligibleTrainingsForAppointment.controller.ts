import Boom from "boom"
import Joi from "joi"
import { zRoutes } from "shared/index"

import { EligibleTrainingsForAppointment } from "../../../common/model/index"
import * as eligibleTrainingsForAppointmentService from "../../../services/eligibleTrainingsForAppointment.service"
import { Server } from "../../server"

const eligibleTrainingsForAppointmentIdPatchSchema = Joi.object({
  is_lieu_formation_email_customized: Joi.boolean().optional(),
  referrers: Joi.array().items(Joi.string()).optional(),
  lieu_formation_email: Joi.string()
    .email({ tlds: { allow: false } })
    .allow(null)
    .optional(),
})

/**
 * Sample entity route module for GET
 */
export default (server: Server) => {
  /**
   * Get all eligibleTrainingsForAppointments GET
   * */
  server.get(
    "/api/admin/eligible-trainings-for-appointment/etablissement-formateur-siret/:siret",
    {
      schema: zRoutes.get["/api/admin/eligible-trainings-for-appointment/etablissement-formateur-siret/:siret"],
      preHandler: [server.auth(zRoutes.get["/api/admin/eligible-trainings-for-appointment/etablissement-formateur-siret/:siret"].securityScheme)],
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
    "/api/admin/eligible-trainings-for-appointment/:id",
    {
      schema: zRoutes.patch["/api/admin/eligible-trainings-for-appointment/:id"],
      preHandler: [server.auth(zRoutes.patch["/api/admin/eligible-trainings-for-appointment/:id"].securityScheme)],
    },
    async ({ body, params }, res) => {
      await eligibleTrainingsForAppointmentIdPatchSchema.validateAsync(body, { abortEarly: false })

      const result = await eligibleTrainingsForAppointmentService.updateParameter(params.id.toString(), body)

      res.send(result)
    }
  )
}
