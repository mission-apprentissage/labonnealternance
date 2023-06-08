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
