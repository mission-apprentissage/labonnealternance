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

      const parameters = await EligibleTrainingsForAppointment.find({ etablissement_formateur_siret: siret }, {
        training_id_catalogue: 1,
        training_intitule_long: 1,
        etablissement_formateur_zip_code: 1,
        training_code_formation_diplome: 1,
        lieu_formation_email: 1,
        is_lieu_formation_email_customized: 1,
        referrers: 1,
        rco_formation_id: 1,
        is_catalogue_published: 1,
        last_catalogue_sync_date: 1,
        parcoursup_id: 1,
        cle_ministere_educatif: 1,
        etablissement_formateur_raison_sociale: 1,
        etablissement_formateur_street: 1,
        departement_etablissement_formateur: 1,
        etablissement_formateur_city: 1,
        lieu_formation_street: 1,
        lieu_formation_city: 1,
        lieu_formation_zip_code: 1,
        etablissement_formateur_siret: 1,
        etablissement_gestionnaire_siret: 1,
        created_at: 1,
        historization_date: 1,
      }).lean()

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

      const result = await eligibleTrainingsForAppointmentService.updateParameter(params.id.toString(), body).lean()

      res.send(result)
    }
  )
}
