import { zRoutes } from "shared/index.js"

import { getMetiersDAvenir } from "../../../services/diagoriente.service"
import { Server } from "../../server"

export default (server: Server) => {
  server.get(
    "/api/metiersdavenir",
    {
      schema: zRoutes.get["/api/metiersdavenir"],
    },
    async (req, res) => {
      const result = await getMetiersDAvenir()

      if (result.error) {
        res.status(500)
      } else {
        res.status(201)
      }

      return res.send(result)
    }
  )
}
