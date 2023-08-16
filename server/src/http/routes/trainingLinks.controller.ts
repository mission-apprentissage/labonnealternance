import express from "express"
import Joi from "joi"
import { getTrainingLinks } from "../../services/trainingLinks.service.js"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"

export default () => {
  const router = express.Router()

  router.post(
    "/",
    tryCatch(async (req, res) => {
      const params = req.body

      await Joi.array()
        .items(
          Joi.object({
            id: Joi.string().required(),
            cle_ministere_educatif: Joi.string().allow(""),
            mef: Joi.string().allow(""),
            cfd: Joi.string().when("rncp", { not: Joi.exist(), then: Joi.string().required() }),
            rncp: Joi.string().when("cfd", { not: Joi.exist(), then: Joi.string().required() }),
            code_postal: Joi.string().allow(""),
            uai: Joi.string().allow(""),
            uai_formateur: Joi.string().when("uai_lieu_formation.uai_formateur_responsable", { not: Joi.exist(), then: Joi.string().required() }),
            uai_formateur_responsable: Joi.string().when("uai_formateur.uai_lieu_formation", { not: Joi.exist(), then: Joi.string().required() }),
            uai_lieu_formation: Joi.string().when("uai_formateur.uai_formateur_responsable", { not: Joi.exist(), then: Joi.string().required() }),
            code_insee: Joi.string().allow(""),
          })
        )
        .max(100)
        .messages({
          "array.base": "body must be an Array",
          "array.max": "maximum 100 trainings",
        })
        .validateAsync(params)

      const results = await getTrainingLinks(params)

      return res.json(results)
    })
  )

  return router
}
