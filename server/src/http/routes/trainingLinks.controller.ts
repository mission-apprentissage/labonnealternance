import { zRoutes } from "shared/index"

import { getTrainingLinks } from "../../services/trainingLinks.service"
import { ServerBuilder } from "../utils/serverBuilder"

export default (server: ServerBuilder) => {
  server.post(
    {
      schema: zRoutes.post["/traininglinks"],
    },
    async (req, res) => {
      const results = await getTrainingLinks(req.body)
      return res.status(200).send(results)
    }
  )
}
