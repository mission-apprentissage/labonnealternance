import Joi from "joi"
import { zRoutes } from "shared/index"

import config from "../../config"
import { REGEX } from "../../services/constant.service"
import { updateContactInfo } from "../../services/lbacompany.service"
import { Server } from "../server"

export default function (server: Server) {
  server.get(
    "/api/updateLBB/updateContactInfo",
    {
      schema: zRoutes.get["/api/updateLBB/updateContactInfo"],
      config: {
        rateLimit: {
          max: 1,
          timeWindow: "20s",
        },
      },
    },
    async (req, res) => {
      await Joi.object({
        secret: Joi.string().required(),
        email: Joi.string().allow("").email(),
        phone: Joi.string().pattern(REGEX["TELEPHONE"]).allow(""),
        siret: Joi.string().pattern(REGEX["SIRET"]).required(),
      }).validateAsync(req.query)

      if (req.query.secret !== config.secretUpdateRomesMetiers) {
        return res.status(401).send("unauthorized")
      } else {
        const result = await updateContactInfo(req.query)

        if (result === "not_found") {
          return res.status(404).send(result)
        }

        return res.status(200).send(result)
      }
    }
  )
}
