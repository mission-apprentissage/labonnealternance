import { getProcessorStatus } from "job-processor"
import { zRoutes } from "shared"

import { Server } from "../../../server"

export function processorAdminRoutes(server: Server) {
  server.get(
    "/_private/admin/processor",
    {
      schema: zRoutes.get["/_private/admin/processor"],
      onRequest: [server.auth(zRoutes.get["/_private/admin/processor"])],
    },
    async (_request, response) => {
      return response.status(200).send(await getProcessorStatus())
    }
  )
}
