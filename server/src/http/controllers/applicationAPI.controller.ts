import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { zRoutes } from "shared/index"

import { sendApplication } from "../../services/application.service"
import { Server } from "../server"

export default function (server: Server) {
  server.post(
    "/v1/application",
    {
      schema: zRoutes.post["/v1/application"],
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "5s",
        },
      },
      bodyLimit: 5 * 1024 ** 2, // 5MB
    },
    async (req, res) => {
      const { company_type } = req.body

      const convertedCompanyType = () => {
        switch (company_type) {
          case "matcha":
            return LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA
          case "lba":
          case "lbb":
            return LBA_ITEM_TYPE.RECRUTEURS_LBA

          case "offres":
            return LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES

          default:
            return
        }
      }

      const result = await sendApplication({
        newApplication: { ...req.body, company_type: convertedCompanyType() as string },
        referer: req.headers.referer as string,
      })

      if ("error" in result) {
        if (result.error === "error_sending_application") {
          res.status(500)
        } else {
          res.status(400)
        }
      } else {
        res.status(200)
      }

      return res.send(result)
    }
  )
}
