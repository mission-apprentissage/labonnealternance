import { ObjectId } from "bson"
import { zRoutes } from "shared"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { Server } from "../server"

export default (server: Server) => {
  server.post(
    "/report-company",
    {
      schema: zRoutes.post["/report-company"],
    },
    async (req, res) => {
      const { itemId, type } = req.query
      await getDbCollection("reported_companies").insertOne({
        _id: new ObjectId(),
        createdAt: new Date(),
        type,
        itemId,
      })
      return res.send({})
    }
  )
}
