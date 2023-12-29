import Boom from "boom"
import { zRoutes } from "shared/index"

import config from "../../config"
import { updateContactInfo } from "../../services/lbacompany.service"
import { Server } from "../server"

export default function (server: Server) {
  server.get(
    "/updateLBB/updateContactInfo",
    {
      schema: zRoutes.get["/updateLBB/updateContactInfo"],
      config: {
        rateLimit: {
          max: 1,
          timeWindow: "20s",
        },
      },
    },
    async (req, res) => {
      const { email, phone, siret } = req.query

      if (req.query.secret !== config.secretUpdateRomesMetiers) {
        throw Boom.unauthorized()
      }

      await updateContactInfo({ email, phone, siret })
      return res.status(200).send("OK")
    }
  )
}
