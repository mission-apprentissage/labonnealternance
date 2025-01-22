import { zRoutes } from "shared"

import { reportCompany } from "@/services/reportedCompany.service"

import { Server } from "../server"

export default (server: Server) => {
  server.post(
    "/report-company",
    {
      schema: zRoutes.post["/report-company"],
    },
    async (req, res) => {
      const { reason, reasonDetails } = req.body
      const { itemId, type } = req.query
      await reportCompany({ itemId, type, reason, reasonDetails })
      return res.send({})
    }
  )
}
