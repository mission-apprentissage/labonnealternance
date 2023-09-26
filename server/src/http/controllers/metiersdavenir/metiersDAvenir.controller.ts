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
      return res.send(result)
    }
  )
}
