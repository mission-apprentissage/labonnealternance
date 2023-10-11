import { zRoutes } from "shared/index.js"

import { ServerBuilder } from "@/http/utils/serverBuilder"

import { getMetiersDAvenir } from "../../../services/diagoriente.service"

export default (server: ServerBuilder) => {
  server.get(
    {
      schema: zRoutes.get["/metiersdavenir"],
    },
    async (req, res) => {
      const result = await getMetiersDAvenir()
      return res.send(result)
    }
  )
}
