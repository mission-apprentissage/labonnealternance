import Boom from "boom"
import { zRoutes } from "shared/index"

import config from "../../config"
import { getCompanyContactInfo, updateContactInfo } from "../../services/lbacompany.service"
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

      if (req.query.secret !== config.lbaSecret) {
        throw Boom.unauthorized()
      }

      await updateContactInfo({ email, phone, siret })
      return res.status(200).send("OK")
    }
  )

  server.get(
    "/lbacompany/:siret/contactInfo",
    {
      schema: zRoutes.get["/lbacompany/:siret/contactInfo"],
      // onRequest: [server.auth(zRoutes.get["/lbacompany/:siret/contactInfo"])],
    },
    async (req, res) => {
      const { siret } = req.params

      const companyData = await getCompanyContactInfo({ siret })
      return res.status(200).send(companyData)
    }
  )

  server.put(
    "/lbacompany/:siret/contactInfo",
    {
      schema: zRoutes.put["/lbacompany/:siret/contactInfo"],
      // onRequest: [server.auth(zRoutes.put["/lbacompany/:siret/contactInfo"])],
      config: {
        rateLimit: {
          max: 1,
          timeWindow: "5s",
        },
      },
    },
    async (req, res) => {
      const { siret } = req.params

      const companyData = await getCompanyContactInfo({ siret })
      return res.status(200).send(companyData)
    }
  )
}
