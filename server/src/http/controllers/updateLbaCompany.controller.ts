import { zRoutes } from "shared/index"

import { getCompanyContactInfo, updateContactInfo } from "../../services/lbacompany.service"
import { Server } from "../server"

export default function (server: Server) {
  server.get(
    "/lbacompany/:siret/contactInfo",
    {
      schema: zRoutes.get["/lbacompany/:siret/contactInfo"],
      onRequest: [server.auth(zRoutes.get["/lbacompany/:siret/contactInfo"])],
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
      onRequest: [server.auth(zRoutes.put["/lbacompany/:siret/contactInfo"])],
      config: {
        rateLimit: {
          max: 1,
          timeWindow: "5s",
        },
      },
    },
    async (req, res) => {
      const { siret } = req.params
      const { phone, email } = req.body

      const companyData = await updateContactInfo({ siret, email, phone })
      return res.status(200).send(companyData)
    }
  )
}
