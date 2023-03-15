// @ts-nocheck
import Boom from "boom"
import express from "express"
import Joi from "joi"
import json2csvParser from "json2csv"
import { logger } from "../../../common/logger.js"
import { getReferrerById } from "../../../common/model/constants/referrers.js"
import { EligibleTrainingsForAppointment } from "../../../common/model/index.js"
import { getFormationsByIdRcoFormations, getFormationsBySiretFormateur } from "../../../services/catalogue.service.js"
import { tryCatch } from "../../middlewares/tryCatchMiddleware.js"

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

const eligibleTrainingsForAppointmentImportSchema = Joi.object({
  parameters: Joi.array()
    .items(
      Joi.object({
        formateur_siret: Joi.string().required(),
        referrers: Joi.array().items(Joi.number()),
        email: Joi.string().required(),
      })
    )
    .required(),
})

const eligibleTrainingsForAppointmentReferrerUpdateBatchSchema = Joi.object({
  referrers: Joi.array().items(Joi.number()).required(),
})

/**
 * Sample entity route module for GET
 */
export default ({ eligibleTrainingsForAppointments, etablissements }) => {
  const router = express.Router()

  /**
   * Get all eligibleTrainingsForAppointments GET
   * */
  router.get(
    "/parameters",
    tryCatch(async (req, res) => {
      const qs = req.query
      const query = qs && qs.query ? JSON.parse(qs.query) : {}
      const page = qs && qs.page ? qs.page : 1
      const limit = qs && qs.limit ? parseInt(qs.limit, 10) : 50

      const allData = await EligibleTrainingsForAppointment.paginate({ query, page, limit })

      const parameters = await Promise.all(
        allData.docs.map(async (parameter) => {
          const etablissement = await etablissements.findOne({ formateur_siret: parameter.etablissement_formateur_siret })

          return {
            etablissement_raison_sociale: etablissement?.raison_sociale || "N/C",
            ...parameter,
            referrers: parameter.referrers,
          }
        })
      )

      return res.send({
        parameters,
        pagination: {
          page: allData.page,
          resultats_par_page: limit,
          nombre_de_page: allData.pages,
          total: allData.total,
        },
      })
    })
  )

  /**
   * Download in CSV.
   */
  router.get(
    "/parameters/export",
    tryCatch(async (req, res) => {
      const qs = req.query
      const query = qs && qs.query ? JSON.parse(qs.query) : {}

      const wigetParameters = await EligibleTrainingsForAppointment.find(query)

      const parameters = []
      for (const parameter of wigetParameters) {
        let formations = null
        // Note: "id_rco_formation" attribute isn't existing for oldest parameters
        if (parameter.rco_formation_id) {
          formations = await getFormationsByIdRcoFormations({
            idRcoFormations: [parameter.rco_formation_id],
          })
        }

        const etablissement = await etablissements.findOne({ formateur_siret: parameter.etablissement_siret })

        parameters.push({
          siret: parameter.etablissement_siret,
          raison_sociale: etablissement?.raison_sociale,
          rco_formation_id: parameter.rco_formation_id,
          formation: parameter.training_intitule_long,
          cfd: parameter.training_code_formation_diplome,
          email: parameter.lieu_formation_email,
          localite: parameter.city,
          email_catalogue: formations.length ? formations[0].email : "",
          code_postal: parameter.etablissement_formateur_zip_code,
          sources: parameter.referrers.map((referrer) => getReferrerById(referrer).full_name).join(", "),
        })
      }

      if (!parameters.length) {
        throw Boom.badRequest("Aucune information a exporter.")
      }

      const csv2json = new json2csvParser.Parser()
      const csv = csv2json.parse(parameters)

      res.setHeader("Content-disposition", "attachment; filename=parametres.csv")
      res.set("Content-Type", "text/csv")

      return res.send(csv)
    })
  )

  /**
   * Get all eligibleTrainingsForAppointments eligibleTrainingsForAppointments/count GET
   */
  router.get(
    "/parameters/count",
    tryCatch(async (req, res) => {
      const qs = req.query
      const query = qs && qs.query ? JSON.parse(qs.query) : {}
      const total = await EligibleTrainingsForAppointment.countDocuments(query)

      res.send({ total })
    })
  )

  /**
   * Get eligibleTrainingsForAppointment eligibleTrainingsForAppointments / GET
   */
  router.get(
    "/",
    tryCatch(async (req, res) => {
      const qs = req.query
      const query = qs && qs.query ? JSON.parse(qs.query) : {}
      const retrievedData = await EligibleTrainingsForAppointment.findOne(query)
      if (retrievedData) {
        res.send(retrievedData)
      } else {
        res.send({ message: `Item doesn't exist` })
      }
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
   * Add/Post an item validated by schema createParameter /eligibleTrainingsForAppointment POST
   */
  router.post(
    "/",
    tryCatch(async ({ body }, res) => {
      await eligibleTrainingsForAppointmentSchema.validateAsync(body, { abortEarly: false })
      const result = await eligibleTrainingsForAppointments.findUpdateOrCreate(body)
      res.send(result)
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
      const result = await eligibleTrainingsForAppointments.updateParameter(params.id, body)
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

      const result = await eligibleTrainingsForAppointments.updateParameter(params.id, body)

      res.send(result)
    })
  )

  /**
   * Delete an item by id deleteParameter eligibleTrainingsForAppointment/{id} DELETE
   */
  router.delete(
    "/:id",
    tryCatch(async ({ params }, res) => {
      logger.info("Deleting new item: ", params.id)
      await eligibleTrainingsForAppointments.deleteParameter(params.id)
      res.send({ message: `Item ${params.id} deleted !` })
    })
  )

  return router
}
