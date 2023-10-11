import Joi from "joi"
import { zRoutes } from "shared/index"

import config from "../../config"
import { REGEX } from "../../services/constant.service"
import { updateContactInfo } from "../../services/lbacompany.service"
import { ServerBuilder } from "../utils/serverBuilder"

export default function (server: ServerBuilder) {
  server.get(
    {
      schema: zRoutes.get["/updateLBB/updateContactInfo"],
    },
    async (req, res) => {
      const { email, phone, siret } = await Joi.object({
        secret: Joi.string().required(),
        email: Joi.string().allow("").email(),
        phone: Joi.string().pattern(REGEX["TELEPHONE"]).allow(""),
        siret: Joi.string().pattern(REGEX["SIRET"]).required(),
      }).validateAsync(req.query)

      if (req.query.secret !== config.secretUpdateRomesMetiers) {
        return res.status(401).send("unauthorized")
      } else {
        const result = await updateContactInfo({ email, phone, siret })

        if (result === "not_found") {
          return res.status(404).send(result)
        }

        return res.status(200).send(result)
      }
    }
  )
}
