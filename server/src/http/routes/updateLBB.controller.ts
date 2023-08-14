// @ts-nocheck
import { REGEX } from "../../services/constant.service.js"
import express from "express"
import Joi from "joi"
import { updateContactInfo } from "../../services/company.service.js"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import config from "../../config.js"

export default function () {
  const router = express.Router()

  router.get(
    "/updateContactInfo",
    tryCatch(async (req, res) => {
      await Joi.object({
        secret: Joi.string().required(),
        email: Joi.string().allow("").email(),
        phone: Joi.string().pattern(REGEX["TELEPHONE"]).allow(""),
        siret: Joi.string().pattern(REGEX["SIRET"]).required(),
      }).validateAsync(req.query)

      if (req.query.secret !== config.secretUpdateRomesMetiers) {
        return res.status(401).json("unauthorized")
      } else {
        const result = await updateContactInfo(req.query)

        if (result === "not_found") {
          return res.status(404).json(result)
        }

        return res.json(result)
      }
    })
  )

  return router
}
