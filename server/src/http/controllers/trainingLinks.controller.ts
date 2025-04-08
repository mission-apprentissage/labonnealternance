import { zRoutes } from "shared/index"

import { getTrainingLinks } from "../../services/trainingLinks.service"
import { Server } from "../server"

export default (server: Server) => {
  server.post("/traininglinks", { schema: zRoutes.post["/traininglinks"] }, async (req, res) => {
    const results = await getTrainingLinks(req.body)
    return res.status(200).send(results)
  })
}
