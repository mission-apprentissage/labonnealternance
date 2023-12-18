import { zRoutes } from "shared/index.js"

import { getMetiersDAvenir } from "../../services/diagoriente.service"
import { Server } from "../server"

export default (server: Server) => {
  server.get(
    "/metiersdavenir",
    {
      schema: zRoutes.get["/metiersdavenir"],
    },
    async (req, res) => {
      const result = await getMetiersDAvenir()
      return res.send(result)
    }
  )
}
