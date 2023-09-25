import express from "express"
import Joi from "joi"

import { logger } from "../../../common/logger"
import { EligibleTrainingsForAppointment, Etablissement } from "../../../common/model/index"
import * as eligibleTrainingsForAppointmentService from "../../../services/eligibleTrainingsForAppointment.service"
import { tryCatch } from "../../middlewares/tryCatchMiddleware"

const eligibleTrainingsForAppointmentIdPatchSchema = Joi.object({
  is_lieu_formation_email_customized: Joi.boolean().optional(),
  referrers: Joi.array().items(Joi.string()).optional(),
  lieu_formation_email: Joi.string()
    .email({ tlds: { allow: false } })
    .allow(null)
    .optional(),
})

const eligibleTrainingsForAppointmentSchema = Joi.object({
  etablissement_siret: Joi.string().required(),
  etablissement_raison_sociale: Joi.string().required(),
  formation_intitule: Joi.string().required(),
  formation_cfd: Joi.string().required(),
  code_postal: Joi.string().required(),
  lieu_formation_email: Joi.string()
    .email({ tlds: { allow: false } })
    .allow(null)
    .required(),
  referrers: Joi.array().items(Joi.number()),
  rco_formation_id: Joi.string().required(),
  cle_ministere_educatif: Joi.string().required(),
})

/**
 * Sample entity route module for GET
 */
export default () => {
  const router = express.Router()

  /**
   * Get all eligibleTrainingsForAppointments GET
   * */
  router.get(
    "/etablissement-formateur-siret/:siret",
    tryCatch(async (req, res) => {
      const { siret } = req.params

      const parameters = await EligibleTrainingsForAppointment.find({etablissement_formateur_siret: siret}).lean();

      if (parameters == undefined || parameters.length == 0) {
        return res.sendStatus(400)
      }

      return res.send({ parameters })
    })
  )

  /**
   * Get eligibleTrainingsForAppointments by id getEligibleTrainingsForAppointmentsById /{id} GET
   */
  router.get(
    "/:id",
    tryCatch(async (req, res) => {
      const itemId = req.params.id
      const retrievedData = await EligibleTrainingsForAppointment.findById(itemId)
      if (retrievedData) {
        res.send(retrievedData)
      } else {
        res.send({ message: `Item ${itemId} doesn't exist` })
      }
    })
  )

  /**
   * Update an item validated by schema updateParameter updateParameter/{id} PUT
   */
  router.put(
    "/:id",
    tryCatch(async ({ body, params }, res) => {
      await eligibleTrainingsForAppointmentSchema.validateAsync(body, { abortEarly: false })
      logger.info("Updating new item: ", body)
      const result = await eligibleTrainingsForAppointmentService.updateParameter(params.id, body)
      res.send(result)
    })
  )

  /**
   * Patch parameter.
   */
  router.patch(
    "/:id",
    tryCatch(async ({ body, params }, res) => {
      await eligibleTrainingsForAppointmentIdPatchSchema.validateAsync(body, { abortEarly: false })

      const result = await eligibleTrainingsForAppointmentService.updateParameter(params.id, body)

      res.send(result)
    })
  )

  return router
}
