import Joi from "joi"
import { zRoutes } from "shared/index"

import { getTrainingLinks } from "../../services/trainingLinks.service"
import { Server } from "../server"

export default (server: Server) => {
  server.post(
    "/api/trainingLinks",
    {
      schema: zRoutes.post["/api/trainingLinks"],
      config: {
        rateLimit: {
          max: 3,
          timeWindow: "1s",
        },
      },
    },
    async (req, res) => {
      const verifiedParams = await Joi.array()
        .items(
          Joi.object({
            id: Joi.string().required(),
            cle_ministere_educatif: Joi.string().allow(""),
            mef: Joi.string().allow(""),
            cfd: Joi.string(),
            rncp: Joi.string(),
            code_postal: Joi.string().allow(""),
            uai: Joi.string().allow(""),
            uai_lieu_formation: Joi.string().allow(""),
            uai_formateur: Joi.string().allow(""),
            uai_formateur_responsable: Joi.string().allow(""),
            code_insee: Joi.string().allow(""),
          })
            .or("uai_lieu_formation", "uai_formateur", "uai_formateur_responsable")
            .or("cfd", "rncp")
        )
        .max(100)
        .messages({
          "array.base": "body must be an Array",
          "array.max": "maximum 100 trainings",
        })
        .validateAsync(req.body, { abortEarly: false })

      const results = await getTrainingLinks(verifiedParams)

      return res.status(200).send(results)
    }
  )
}
